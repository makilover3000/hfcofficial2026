import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel

from app.core.state import AppState
from app.core.data_loader import load_geojson, fetch_environment_data
from app.core.alerts import AlertStore
from app.core.demo import DemoRunner
from app.models.site import SiteControl

state = AppState()
alert_store = AlertStore()
demo_runner = DemoRunner()
connected_websockets: List[WebSocket] = []

async def broadcast_message(message: Dict[str, Any]):
    if not connected_websockets:
        return
    try:
        message_json = json.dumps(message, default=str)
    except Exception as e:
        print(f"JSON serialization error: {e}")
        return
    disconnected = []
    for ws in connected_websockets:
        try:
            await ws.send_text(message_json)
        except Exception as e:
            print(f"WebSocket send error: {e}")
            disconnected.append(ws)
    for ws in disconnected:
        if ws in connected_websockets:
            connected_websockets.remove(ws)

async def agent_loop():
    while True:
        try:
            if state.sites and not demo_runner.running:
                results = await state.orchestrator.process_cycle(state.sites, state.metrics)

                if results.get('site_updates'):
                    for site_id, updates in results['site_updates'].items():
                        if site_id in state.sites:
                            state.sites[site_id].update(updates)
                    state.update_metrics()

                await broadcast_message({
                    'type': 'agent_update',
                    'agents': state.orchestrator.get_all_agent_status(),
                    'logs': state.orchestrator.get_recent_logs(10),
                    'metrics': state.metrics.model_dump(),
                    'site_updates': results.get('site_updates', {})
                })

            await asyncio.sleep(5)
        except Exception as e:
            print(f"Agent loop error: {e}")
            await asyncio.sleep(10)

async def environment_update_loop():
    while True:
        try:
            env_data = await fetch_environment_data()
            state.update_environment(env_data)
            await broadcast_message({
                'type': 'environment_update',
                'environment': env_data.model_dump()
            })
        except Exception as e:
            print(f"Environment update error: {e}")
        await asyncio.sleep(300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    geojson_path = Path(__file__).parent.parent / "HDBUnderConstructionBuildings.geojson"
    sites = load_geojson(str(geojson_path))
    state.load_sites(sites)

    env_data = await fetch_environment_data()
    state.update_environment(env_data)

    state.orchestrator.set_broadcast_callback(broadcast_message)

    agent_task = asyncio.create_task(agent_loop())
    env_task = asyncio.create_task(environment_update_loop())

    yield

    agent_task.cancel()
    env_task.cancel()

app = FastAPI(
    title="Construction Orchestration AI",
    description="Interactive multi-agent system for construction site coordination",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Construction Orchestration AI API", "status": "running"}

@app.get("/sites")
async def get_sites():
    return state.get_all_sites_for_map()

@app.get("/sites/{site_id}")
async def get_site(site_id: str):
    site = state.get_site(site_id)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")
    return site

@app.post("/sites/{site_id}/control")
async def control_site(site_id: str, control: SiteControl):
    updates = {}
    if control.noise_level is not None:
        updates['noise_level'] = control.noise_level
    if control.dust_level is not None:
        updates['dust_level'] = control.dust_level
    if control.dust_suppression is not None:
        updates['dust_suppression'] = control.dust_suppression
    if control.agent_controlled is not None:
        updates['agent_controlled'] = control.agent_controlled

    site = state.update_site(site_id, updates)
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    state.orchestrator.add_to_log({
        'agent': 'User',
        'icon': '👤',
        'type': 'user_control',
        'site_id': site_id,
        'site_name': site.get('name', site_id),
        'updates': updates
    })

    await broadcast_message({
        'type': 'site_update',
        'site_id': site_id,
        'site': site,
        'metrics': state.metrics.model_dump()
    })

    return site

@app.get("/agents/status")
async def get_agents_status():
    return state.orchestrator.get_all_agent_status()

@app.get("/metrics/district")
async def get_district_metrics():
    return state.metrics.model_dump()

@app.get("/logs")
async def get_logs(count: int = 50):
    return state.orchestrator.get_recent_logs(count)

# --- Clusters ---
@app.get("/clusters")
async def get_clusters():
    return state.compute_clusters()

# --- Demo ---
@app.post("/demo/start")
async def start_demo():
    if demo_runner.running:
        return {"status": "already_running"}

    def update_site_fn(site_id, updates):
        state.update_site(site_id, updates)

    asyncio.create_task(demo_runner.start(
        sites=state.sites,
        broadcast=broadcast_message,
        update_site=update_site_fn,
        update_metrics=state.update_metrics,
        get_sites_for_map=state.get_all_sites_for_map,
        get_metrics_dump=lambda: state.metrics.model_dump(),
        alert_store=alert_store,
        get_alerts=alert_store.get_alerts,
        get_clusters=state.compute_clusters,
        add_log=state.orchestrator.add_to_log,
        get_logs=lambda: state.orchestrator.get_recent_logs(20)
    ))

    return {"status": "started"}

@app.post("/demo/reset")
async def reset_demo():
    demo_runner.reset(
        state.sites,
        lambda sid, upd: state.update_site(sid, upd),
        state.update_metrics
    )

    await broadcast_message({
        'type': 'demo_event',
        'demo': {'phase': 'complete'},
        'sites': state.get_all_sites_for_map(),
        'metrics': state.metrics.model_dump(),
        'clusters': state.compute_clusters()
    })

    return {"status": "reset"}

# --- Alerts ---
@app.get("/alerts")
async def get_alerts():
    return alert_store.get_alerts()

@app.post("/alerts/{alert_id}/approve")
async def approve_alert(alert_id: str):
    alert = alert_store.approve_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    await broadcast_message({
        'type': 'alert_update',
        'alerts': alert_store.get_alerts()
    })

    return alert

@app.post("/alerts/{alert_id}/override")
async def override_alert(alert_id: str):
    alert = alert_store.override_alert(alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    await broadcast_message({
        'type': 'alert_update',
        'alerts': alert_store.get_alerts()
    })

    return alert

# --- CSV Report ---
@app.get("/reports/csv")
async def get_csv_report():
    csv_content = alert_store.generate_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=urbanpulse_report.csv"}
    )

# --- WebSocket ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)

    try:
        initial_state = {
            'type': 'initial_state',
            'agents': state.orchestrator.get_all_agent_status(),
            'metrics': state.metrics.model_dump(),
            'logs': state.orchestrator.get_recent_logs(20),
            'alerts': alert_store.get_alerts()
        }
        await websocket.send_text(json.dumps(initial_state, default=str))

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get('type') == 'control_site':
                site_id = message.get('site_id')
                updates = message.get('updates', {})
                site = state.update_site(site_id, updates)

                if site:
                    site_name = site.get('name', site_id)
                    state.orchestrator.add_to_log({
                        'agent': 'User',
                        'icon': '👤',
                        'type': 'user_control',
                        'site_id': site_id,
                        'site_name': site_name,
                        'updates': updates
                    })

                    await broadcast_message({
                        'type': 'site_update',
                        'site_id': site_id,
                        'site': site,
                        'metrics': state.metrics.model_dump()
                    })

                    # Trigger agent shuffle when user starts heavy work (high noise)
                    noise = updates.get('noise_level', 0)
                    if noise >= 80:
                        asyncio.create_task(
                            state.orchestrator.run_agent_shuffle(site_id, site_name)
                        )

    except WebSocketDisconnect:
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
