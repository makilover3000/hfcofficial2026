import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.state import AppState
from app.core.data_loader import load_geojson, fetch_environment_data
from app.models.site import SiteControl

state = AppState()
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
            if state.sites:
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

            await asyncio.sleep(3)
        except Exception as e:
            print(f"Agent loop error: {e}")
            await asyncio.sleep(5)

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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.append(websocket)

    try:
        initial_state = {
            'type': 'initial_state',
            'sites': state.get_all_sites_for_map(),
            'agents': state.orchestrator.get_all_agent_status(),
            'metrics': state.metrics.model_dump(),
            'logs': state.orchestrator.get_recent_logs(20)
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
