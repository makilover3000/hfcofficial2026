# UrbanConstruct AI — Construction Orchestration System

**Hack for Cities 2026 | Singapore Management University**

An interactive, real-time multi-agent AI system that autonomously coordinates construction activities across Singapore's 200 real HDB construction sites to minimize environmental impact on residents — without human intervention.

---

## Quick Start

### Prerequisites
- **Node.js** 16+
- **Python** 3.8+
- **pip packages:** `fastapi`, `uvicorn`, `pydantic`, `httpx`

### 1. Start the Backend
```bash
cd backend
pip install fastapi uvicorn pydantic httpx
python main.py
```
Backend runs on `http://localhost:8000`

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` — open this in your browser.

> Both must be running simultaneously. The frontend connects to the backend via WebSocket on port 8000.

---

## What It Does

UrbanConstruct AI demonstrates **autonomous multi-agent coordination** that automatically reduces construction equipment activity without human intervention:

### How Automatic Reduction Works (No Human Needed)

1. **Perception Agent** continuously monitors all 200 sites every 5 seconds. When noise exceeds 85dB or dust exceeds 50 µg/m³, it flags the site immediately.

2. **Risk Agent** calculates the cumulative impact on nearby HDB residents — factoring in wind direction, adjacent site activity, and population density — to determine an exposure risk score.

3. **Control Agent** issues autonomous directives to equipment systems:
   - **Stagger piling schedules** between adjacent sites (e.g., alternating 2-hour windows)
   - **Reduce pile-driving intensity** from full power to partial (92dB → 62dB)
   - **Activate dust suppression** systems (water misting increased to 85-90%)
   - **Pause excavation** at secondary sites when a primary site is spiking

4. **Verification Agent** measures the actual reduction achieved and confirms the intervention worked (e.g., 29% noise reduction verified).

This entire loop runs autonomously. The Town Council dashboard allows human oversight and can approve or override AI decisions, but the system acts first to protect residents.

---

## Tabs — What Each One Does

### 1. Map Tab (Main View)

This is the primary dashboard. It shows all 200 real HDB construction sites plotted on a live Mapbox map of Singapore.

**What you see:**
- Every construction site is rendered as its **actual polygon shape** (not a dot) with a color-coded glow aura behind it
- **Green** = normal operations, **Yellow** = elevated noise/dust, **Red** = high impact exceeding safety thresholds
- The glow pulses — sites "breathe" with intensity matching how severe they are
- **Left panel:** A scrolling Action Log showing every decision the AI agents make in real time (e.g., "Perception Agent flagged Site X — noise 92dB exceeds 85dB threshold")
- **Right panel:** Status cards for all 4 AI agents (Perception, Risk, Control, Verification) showing what each agent is currently doing

**What you can do:**
- **Click any site** → the map flies to it and zooms in. A detail card slides in from the right showing:
  - Site name, contractor, and current state (Normal / Elevated / High Impact)
  - **3 sliders** you can drag to manually adjust: Pile-Driving Intensity (dB), Excavation Dust (µg/m³), and Dust Suppression (%)
  - **AI/Manual toggle** — switch between letting the AI control the site or taking manual control
  - **Quick action buttons** — "Start Heavy Work" (simulates a spike) and "Reset to Normal"
- **Click "Start Demo"** (bottom center) → triggers the full autonomous coordination scenario. The map flies to the Ang Mo Kio–Bishan corridor, a dashed cluster boundary appears around the 3 demo sites (labeled Site A, B, C), and you watch the AI detect a cumulative violation and coordinate a response across all 3 sites — zero human clicks needed

**Why this matters for judges:** This tab proves the system works with real geographic data at scale (200 sites) and that the AI acts autonomously. You can also manually spike a site and watch the AI respond.

---

### 2. Orchestration Tab

This tab visualizes **how the 4 AI agents coordinate** across a cluster of nearby sites. It is the best tab to demonstrate the multi-agent pipeline.

**What you see:**
- **Left panel:** A list of all detected clusters (groups of construction sites within 0.5km of each other). Each cluster shows its name, number of sites, and current severity level
- **Center:** An SVG orchestration diagram showing 3 representative sites (A, B, C) as circles. Their colors update in real time to match their state (green/yellow/red). HDB blocks are shown below each site to represent affected residents
- **Right panel:** Cluster details, demo controls, and agent action feed

**What you can do:**
- **Click any cluster** in the left panel to view its orchestration diagram
- **Click "Start Demo"** to watch the full AI coordination cycle with animated wave effects:
  - **Spike phase:** Red shockwave rings pulse outward from Site A as it violates the noise threshold. Site B is already yellow (elevated), showing the **cumulative impact problem** — it's not just one bad site, it's the combined effect
  - **Detect phase:** Yellow scanning pulses show the Perception Agent detecting the violation
  - **Coordinate phase:** Blue expanding waves travel from Site A to Sites B and C — the Control Agent is sending directives. Animated dashed arcs show the communication paths
  - **Verify phase:** Green success waves radiate from all 3 sites — the Verification Agent confirms the reduction worked
- **Before/After metrics** appear during the verify phase showing exactly how much noise was reduced (e.g., 92dB → 62dB, ↓33%)

**Why this matters for judges:** This tab makes the invisible AI coordination visible. You can literally see the agents detect → assess → act → verify in a clear animated sequence. The cumulative impact story (Site A red + Site B yellow) demonstrates why district-level coordination is needed — not just single-site monitoring.

---

### 3. Town Council Tab

This tab represents the **human oversight layer**. The AI acts first to protect residents, then the Town Council reviews what happened and can approve or override the AI's decisions.

**What you see:**
- **Alert cards** generated by the AI after each intervention. Each card shows:
  - **Severity badge** (Critical / Warning / Moderate) with color coding
  - **Cluster name** — which geographic area was affected
  - **Affected HDB blocks** — the specific sites involved
  - **Estimated residents affected** — how many people were impacted (e.g., 2,400 residents)
  - **AI recommendation** — a detailed explanation of what the AI did and why (e.g., "Cumulative impact detected — Site A at 92dB + Site B at 78dB. AI reduced all sites: Site A 92→62dB, Site B 78→55dB. ↓33% peak reduction.")

**What you can do:**
- **Approve** — Town Council agrees with the AI's action. The alert is marked as approved
- **Override** — Town Council disagrees and overrides the AI's decision. This is logged for accountability
- **Download CSV Report** — exports a compliance report with separate Date and Time columns, including: Cluster, Triggering Site, Violation Type, Affected HDB Blocks, Estimated Residents, AI Action Taken, Impact Before/After, Reduction %, Town Council Decision, and Status

**Why this matters for judges:** This tab proves the system doesn't replace humans — it assists them. The AI acts immediately to protect residents (because waiting for human approval during a noise spike means residents suffer longer), but every action is logged, explained, and subject to human review. The CSV download makes the system audit-ready for real-world compliance.

---

### 4. Analytics Tab

This tab provides **district-wide metrics and cluster-level analytics** for a high-level overview of environmental conditions across all 200 sites.

**What you see:**
- **Cluster analytics** — each cluster shows its severity distribution (how many sites are normal vs elevated vs high impact)
- **District-wide metrics** — aggregated environmental data including:
  - Maximum noise level across all sites and which site is the loudest
  - PM2.5 readings (baseline from NEA + construction-contributed)
  - Number of elevated and high-impact sites
  - Estimated total affected residents
  - Overall district risk score (0-10)
- **Real-time environment data** pulled from data.gov.sg APIs: PM2.5, temperature, humidity, wind speed/direction, and rainfall

**Why this matters for judges:** This tab shows the system operates at a **district level**, not just individual sites. Decision-makers can see the big picture — which clusters are problematic, how many residents are affected across the entire district, and whether environmental conditions (wind, rain) are making things worse.

---

## Demo Walkthrough

1. Open the **Map tab** and click **Start Demo**
2. The map flies to the Ang Mo Kio — Bishan corridor and a dashed cluster boundary appears around 3 sites (labeled Site A, B, C)
3. **Phase 1 (Spike):** Site A noise spikes to 92dB (turns red). Site B is already at 78dB (turns yellow). This shows the **cumulative impact problem** — two nearby sites together exceeding safe levels for residents
4. **Phase 2 (Detect):** Perception Agent detects the cumulative violation within 3 seconds
5. **Phase 3 (Coordinate):** Control Agent sends directives to all 3 sites — stagger piling, reduce intensity, activate dust suppression
6. **Phase 4 (Mitigate):** All 3 sites reduce activity autonomously — Site A drops from 92→62dB, Site B drops from 78→55dB
7. **Phase 5 (Verify):** Verification Agent confirms 33% peak reduction achieved (92dB → 62dB)
8. **Phase 6 (Complete):** An alert is created for the Town Council tab to review. A CSV row is logged for compliance. Map returns to the original view
9. Switch to the **Town Council tab** to approve or override the AI's decision, or download the CSV report

---

## How This Addresses Key Concerns

### "Lack of explanation of how systems automatically reduce equipment activity without human intervention"

This system demonstrates this explicitly through the demo:

| Phase | What Happens Automatically |
|-------|---------------------------|
| Detection | Perception Agent flags noise >85dB within 5 seconds |
| Risk Assessment | Risk Agent calculates cumulative impact on 2,400+ residents |
| Equipment Control | Control Agent issues directives: reduce piling intensity, stagger schedules, activate water misting |
| Verification | Verification Agent confirms reduction achieved (92dB → 62dB = 29% reduction) |

The AI agents operate in a continuous 5-second loop. When thresholds are exceeded, the Control Agent autonomously adjusts equipment parameters — no human clicks a button. The Town Council tab exists for **oversight**, not for triggering the response.

### "How can feasibility be improved?"

| Feasibility Factor | How This System Addresses It |
|--------------------|-------------------|
| **Real Data** | Uses actual GeoJSON of 200 HDB construction sites from official government data |
| **Live Environment** | Integrates real-time PM2.5, temperature, humidity, wind speed/direction, and rainfall from data.gov.sg |
| **Measurable Outcomes** | Every intervention shows before/after metrics with percentage reduction |
| **Human Oversight** | Town Council can approve or override any AI decision — the system doesn't replace humans, it assists them |
| **Exportable Reports** | CSV download for compliance and auditing |
| **Existing Infrastructure** | Works with standard IoT noise/dust sensors already deployed at Singapore construction sites |
| **Scalable Architecture** | WebSocket-based real-time system handles 200 sites simultaneously |

---

## Technology Stack

**Frontend:** React 18, TypeScript, Mapbox GL JS, Framer Motion, Recharts, Tailwind CSS, Vite

**Backend:** FastAPI (Python), WebSockets, Async data fetching from data.gov.sg

**Data:** HDB Under Construction Buildings GeoJSON, NEA real-time weather APIs

---

## Architecture

```
Construction Sites (200 real HDB sites)
              ↓
    Agent Loop (every 5 seconds)
              ↓
┌──────────────────────────────────────────┐
│  Perception → Risk → Control → Verify    │
│  (detect)   (assess) (act)    (confirm)  │
└──────────────────────────────────────────┘
              ↓
    WebSocket Broadcast → All Connected Clients
              ↓
    Frontend: Map + Orchestration + Town Council + Analytics
```

---

## Project Structure

```
hfcofficial2026/
├── frontend/                    # React TypeScript UI
│   ├── src/
│   │   ├── App.tsx             # Main application + WebSocket handler
│   │   ├── components/
│   │   │   ├── Map.tsx         # Mapbox map with glow auras + click-to-zoom
│   │   │   ├── ControlPanel.tsx # Site detail card with sliders
│   │   │   ├── OrchestrationTab.tsx  # Cluster diagram + demo
│   │   │   ├── TownCouncilTab.tsx    # Alert approval/override
│   │   │   ├── AnalyticsTab.tsx      # Charts and analytics
│   │   │   ├── MetricsBar.tsx        # Top metrics bar
│   │   │   ├── AgentStatusPanel.tsx  # Agent status cards
│   │   │   ├── ActionLog.tsx         # AI decision log
│   │   │   ├── TabBar.tsx            # Tab navigation
│   │   │   └── WaveCanvas.tsx        # Coordination wave animations
│   │   ├── hooks/useWebSocket.ts     # WebSocket connection hook
│   │   └── types/index.ts           # TypeScript interfaces
│   └── package.json
│
├── backend/                     # FastAPI Python server
│   ├── main.py                 # API routes, WebSocket, demo runner
│   ├── app/
│   │   ├── agents/             # 4 autonomous agents
│   │   │   ├── perception.py   # Threshold detection
│   │   │   ├── risk.py         # Impact assessment
│   │   │   ├── control.py      # Equipment directives
│   │   │   └── verification.py # Outcome verification
│   │   ├── core/
│   │   │   ├── state.py        # App state + cluster computation
│   │   │   ├── data_loader.py  # GeoJSON + environment API
│   │   │   ├── alerts.py       # Alert store + CSV generation
│   │   │   └── demo.py         # Demo scenario runner
│   │   └── models/             # Pydantic models
│   └── requirements.txt
│
└── HDBUnderConstructionBuildings.geojson  # Official site data
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sites` | GET | All construction sites as GeoJSON |
| `/sites/{id}/control` | POST | Update site noise/dust levels |
| `/agents/status` | GET | Current status of all 4 agents |
| `/metrics/district` | GET | District-wide environmental metrics |
| `/clusters` | GET | Geographically grouped site clusters |
| `/demo/start` | POST | Start the autonomous coordination demo |
| `/demo/reset` | POST | Reset demo to baseline values |
| `/alerts` | GET | All alerts for Town Council |
| `/alerts/{id}/approve` | POST | Town Council approves AI recommendation |
| `/alerts/{id}/override` | POST | Town Council overrides AI recommendation |
| `/reports/csv` | GET | Download CSV compliance report |
| `/ws` | WebSocket | Real-time bidirectional updates |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not loading | Check Mapbox token in `frontend/src/components/Map.tsx` |
| Backend connection failed | Ensure backend is running on port 8000 |
| Port 8000 already in use | Kill the existing process: `netstat -ano \| findstr :8000` then `taskkill /PID <pid> /F` |
| No site data | Verify `HDBUnderConstructionBuildings.geojson` exists in root directory |
| WebSocket disconnected | Refresh the page to reconnect |
| Demo sites stay green | Reset demo first, then start again |

---

*Built by Makendra Prasad for Hack for Cities 2026 — Singapore Management University*
