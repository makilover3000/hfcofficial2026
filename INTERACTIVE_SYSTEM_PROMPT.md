# 🏗️ Interactive Construction Orchestration AI - Hack for Cities 2026

I'm building an **INTERACTIVE agentic AI system** for a hackathon (deadline: Jan 29, 2200 hrs).

This is NOT a scripted demo. This is a REAL-TIME INTERACTIVE SYSTEM where users can manually control construction sites and watch AI agents respond autonomously.

---

## WHAT THIS IS

An interactive web application where:
1. Users see a **real satellite map of Singapore** with 82 actual HDB construction sites
2. Users can **click on any site** and manually control noise/dust levels with sliders
3. **AI agents monitor the entire district** and autonomously respond when users create problems
4. Users see agents **thinking, deciding, and acting in real-time**

**The innovation:** Multi-site orchestration. When you make Site A noisy, agents coordinate across the district - they might tell Site B to pause work, increase dust suppression at Site C, and notify residents near all affected areas. This district-level coordination exceeds human cognitive capacity.

---

## THE REAL DATA I HAVE

**82 Actual HDB Construction Sites (GeoJSON file)**
Each site has:
- Exact polygon coordinates (building footprints)
- Site name (e.g., "FENGSHAN GREENVILLE")
- Construction dates (start/completion)
- Contractor info (company, contact)
- Status ("Under Construction")

Example site properties:
```json
{
  "NAME": "FENGSHAN GREENVILLE",
  "STATUS": "Under Construction",
  "ESTMT_CNSTRN_CMCMNT": "1Q 2013",
  "ESTMT_CNSTRN_CMPLTN": "4Q 2018",
  "CTRCTR_NAME": "CHINA CONSTRUCTION (SOUTH PACIFIC) DEVELOPMENT CO PTE LTD",
  "geometry": {
    "type": "Polygon",
    "coordinates": [[...]]
  }
}
```

**Real Singapore Environmental Data (data.gov.sg APIs)**
- PM2.5: `https://api.data.gov.sg/v1/environment/pm25`
- Temperature: `https://api.data.gov.sg/v1/environment/air-temperature`
- Humidity: `https://api.data.gov.sg/v1/environment/relative-humidity`
- Rainfall: `https://api.data.gov.sg/v1/environment/rainfall`
- Wind: `https://api.data.gov.sg/v1/environment/wind-speed`

---

## HOW IT WORKS

### User Interaction Flow:

1. **User opens the web app**
   - Sees satellite map of Singapore
   - 82 HDB construction sites shown as polygons on map
   - Can zoom, pan, explore

2. **User clicks a construction site**
   - Site becomes "selected" (highlighted)
   - Control panel appears showing site name and details
   - Interactive sliders/buttons appear:
     - "Pile-Driving Intensity" slider (0-100 → controls dB)
     - "Excavation Level" slider (0-100 → controls dust)
     - Buttons: "Start Heavy Work", "Pause Work", "Resume Normal"

3. **User adjusts controls (e.g., cranks noise to 85dB)**
   - Sensor readings update immediately
   - Site turns orange/red on map
   - Risk zones appear around affected HDB blocks

4. **AI Agents detect and respond autonomously:**
   - **Perception Agent:** "Noise spike detected at FENGSHAN GREENVILLE"
   - **Risk Agent:** "Calculating... 3 HDB blocks affected, 1,200 residents exposed"
   - **Control Agent:** "Decision: Increase dust suppression to 80%, notify residents, request nearby Site B to delay work"
   - **Verification Agent:** "Monitoring effectiveness... noise reduced to 78dB"

5. **User sees agent actions in UI:**
   - Agent status panel shows each agent's current state
   - Action log shows decisions being made
   - Map shows coordinated actions across multiple sites
   - Metrics update in real-time

6. **User can test different scenarios:**
   - "What if I make 3 sites noisy at once?"
   - "What if I ignore agent warnings and keep going?"
   - "What if Site A and Site B are close together?"
   - Agents adapt and coordinate autonomously

---

## THE 4 AUTONOMOUS AGENTS

These agents monitor ALL construction sites simultaneously and make decisions based on the district-wide state.

**Perception Agent**
- Continuously monitors sensor data from all 881 sites
- Detects when ANY site exceeds thresholds (noise > 75dB, PM2.5 > 35)
- Identifies patterns (e.g., "3 sites near Bedok all spiking")
- Triggers Risk Agent when problems detected

**Risk & Impact Agent**
- Calculates "Resident Exposure Risk Score" for the entire district
- Considers:
  - Duration and intensity at each site
  - Time-of-day (higher weights for 7-9am, 12-2pm, 6-10pm)
  - Proximity to residential HDB blocks
  - **Cumulative burden** (if Site A and Site B both loud → nearby residents get double impact)
- Creates spatial risk map showing affected areas

**Control & Policy Agent** (The Coordinator)
- Makes autonomous decisions for the entire district:
  - "Site A is loud → increase its dust suppression"
  - "Sites A and B are both loud and close → tell B to pause"
  - "Site C is far from residents → let it continue normally"
  - "Send targeted notifications to affected HDB blocks only"
  - "Log compliance evidence for authorities"
- Uses LLM reasoning for complex multi-site coordination
- Executes actions without human approval

**Verification & Learning Agent**
- Measures if control actions actually reduced exposure
- Compares sensor readings before/after interventions
- Learns: "Increasing dust suppression worked well at Site A"
- Adapts future strategies based on effectiveness

---

## THE INTERACTIVE UI

### Map View (Main Focus - 60% of screen)

**Implementation:**
- Use **Mapbox GL JS** or **Leaflet** with satellite tiles
- Load the 82 HDB site polygons from GeoJSON
- Style polygons by state:
  - Green: Normal operation (<75dB)
  - Yellow: Elevated (75-85dB)
  - Red: High impact (>85dB)
  - Blue outline: Currently selected by user
- Add HDB residential blocks as small markers/icons
- Show risk zones as colored overlays (transparent red/yellow/green circles)
- Zoom controls, pan, clickable sites

**Map Interactions:**
- Click any site polygon → selects it, shows control panel
- Hover over site → shows tooltip with name and current metrics
- Sites pulse/animate when agents take actions on them
- Risk zones animate outward when impacts detected

### Control Panel (Sidebar or Bottom - 20% of screen)

When a site is selected, show:
```
┌─ Site: FENGSHAN GREENVILLE ────────────────┐
│ Contractor: CHINA CONSTRUCTION (SOUTH...)  │
│ Status: Under Construction (1Q 2013 - ...) │
│                                             │
│ 🎛️ MANUAL CONTROLS                         │
│ ────────────────────────────────────       │
│ Pile-Driving Intensity                     │
│ [=========>           ] 75 dB              │
│                                             │
│ Excavation/Dust Level                      │
│ [=====>               ] 35 µg/m³           │
│                                             │
│ [▶️ Start Heavy Work]  [⏸️ Pause Work]     │
│ [🔄 Reset to Normal]   [🚨 Simulate Alert] │
│                                             │
│ Dust Suppression: [🤖 Auto] [Manual: 50%] │
└─────────────────────────────────────────────┘
```

### Agent Status Panel (Sidebar - 15% of screen)

```
┌─ 🤖 AUTONOMOUS AGENTS ─────────────────────┐
│                                             │
│ 🔵 Perception Agent                         │
│    Status: Monitoring 881 sites            │
│    ↳ Alert: Site A exceeds 75dB threshold  │
│    [●●●○○○○○] Active                       │
│                                             │
│ 🟢 Risk & Impact Agent                      │
│    Status: Calculating district exposure   │
│    ↳ 3 HDB blocks, 1,200 residents         │
│    [●●●●●●○○] Computing                    │
│                                             │
│ 🟠 Control & Policy Agent                   │
│    Status: Executing coordination          │
│    ↳ Action: Increase dust suppression     │
│    ↳ Action: Notify Site B to pause        │
│    [●●●●●●●●] Executing                    │
│                                             │
│ 🟡 Verification Agent                       │
│    Status: Measuring effectiveness         │
│    ↳ Noise reduced: 85dB → 78dB ✓          │
│    [●●●○○○○○] Verifying                    │
└─────────────────────────────────────────────┘
```

### Live Metrics & Data (Top Bar - 5% of screen)

```
┌─ 📊 DISTRICT METRICS ───────────────────────────────────────┐
│ 🔊 Max Noise: 85dB (Site A) | 💨 PM2.5: 45 µg/m³            │
│ Baseline: 15 (data.gov.sg) + Construction: 30 = 45 total   │
│ 🌡️ 32°C | 💧 75% | 🌪️ Wind: 3 m/s SE | ☁️ No rain         │
│ ⚠️ 3 sites elevated | 🔴 1,200 residents affected           │
└─────────────────────────────────────────────────────────────┘
```

### Action Log (Bottom Panel - 10% of screen, scrollable)

```
┌─ 📜 AGENT DECISION LOG ─────────────────────────────────────┐
│ 17:45:30  🟢 System initialized - monitoring 881 sites      │
│ 17:45:45  👤 User selected FENGSHAN GREENVILLE              │
│ 17:45:50  👤 User increased pile-driving to 85dB            │
│ 17:45:51  🔴 Perception: Noise threshold exceeded (85dB)    │
│ 17:45:52  🤖 Risk: Computing exposure... 3 blocks affected  │
│ 17:45:53  📊 Risk: 1,200 residents, Risk Score: 8.2/10      │
│ 17:45:54  ⚡ Control: Decision - Multi-site coordination    │
│ 17:45:55  💨 Control: Increasing dust suppression → 80%     │
│ 17:45:56  📤 Control: Sending notifications to 1,200        │
│ 17:45:57  ⏸️ Control: Requesting Site B (200m away) pause  │
│ 17:45:58  ✅ Verification: Monitoring intervention          │
│ 17:46:02  ✅ Verification: Noise reduced to 78dB            │
│ 17:46:03  🟢 System: All metrics returning to normal        │
└─────────────────────────────────────────────────────────────┘
```

---

## KEY FEATURES TO BUILD

### 1. Real-Time Agent Decision Loop

```
User Action → Sensor Update → Perception Detects → Risk Calculates → 
Control Decides → Actions Execute → Verification Checks → UI Updates
```

This loop runs continuously (every 2-5 seconds when sites are active).

### 2. Multi-Site Coordination Logic

The Control Agent must consider the ENTIRE DISTRICT, not just one site:

Example scenarios:
- **Site A loud + Site B loud + Sites are close:** "Both sites must reduce, or stagger their noisy work"
- **Site A loud + Site B loud + Sites are far apart:** "Both can continue with local mitigation"
- **Site A loud + Site B normal + Site B is nearby:** "Ask Site B to delay their planned noisy work"
- **3+ sites loud simultaneously:** "Emergency district-wide coordination, prioritize most affected residents"

### 3. Interactive Controls

Users can:
- Click sites to select them
- Use sliders to adjust noise (0-100dB) and dust (0-100 µg/m³)
- Press buttons to trigger scenarios: "Start Heavy Work", "Emergency Stop"
- Toggle dust suppression: Auto (agent controlled) vs Manual (user controlled)
- See immediate feedback in all panels

### 4. Visual Feedback

- Site colors change based on state (green/yellow/red)
- Risk zones pulse and animate on map
- Agent status indicators pulse when active
- Numbers count up/down smoothly (not instant jumps)
- Action log auto-scrolls to latest
- Smooth transitions everywhere

### 5. Preset Scenarios (Optional but cool)

Add buttons for quick testing:
- "Scenario 1: Single Site Overload" (one site goes 90dB)
- "Scenario 2: Cluster Conflict" (3 nearby sites all spike)
- "Scenario 3: District-Wide Stress" (5+ sites active)
- "Scenario 4: Agent Override Test" (user ignores agent warnings)

---

## DATA INTEGRATION

### Real Singapore Data (data.gov.sg)

Fetch every 5 minutes:
- Current PM2.5 for the region
- Temperature, humidity, wind speed
- Rainfall status

Display as: "Baseline PM2.5: 15 µg/m³ (data.gov.sg)"

### Simulated Construction Impact

When user adjusts site controls:
- Pile-driving slider (0-100) → Noise in dB (40-95dB range)
- Excavation slider (0-100) → PM2.5 increase (0-50 µg/m³)
- Total PM2.5 = Baseline (real) + Construction (simulated)

### Weather Impact on Simulation

Use real weather to affect simulation:
- If wind > 5 m/s → dust spreads 50% further (bigger risk zones)
- If rainfall > 0 → dust suppressed by 80%, construction paused
- If humidity > 80% → dust settles faster (smaller risk zones)

---

## TECHNICAL STACK

**Backend:**
- Python with FastAPI
- Multi-agent orchestration with LangGraph or CrewAI
- SQLite for storing decisions, actions, sensor history
- WebSocket for real-time UI updates (push agent decisions immediately)
- HTTPX for data.gov.sg API calls

**Frontend:**
- React with TypeScript
- **Mapbox GL JS** or **Leaflet** for interactive map with satellite view
- Tailwind CSS for styling
- Framer Motion for smooth animations
- WebSocket client for real-time updates
- React Query for data fetching

**Map Implementation:**
- **Mapbox GL JS** (required for satellite view)
  - Sign up at mapbox.com (free, no credit card needed)
  - Free tier: 50,000 map loads/month (more than enough)
  - Use style: `mapbox://styles/mapbox/satellite-streets-v12` for satellite view
  - Beautiful imagery, smooth performance, perfect for GeoJSON overlays

**Agent Logic:**
- Perception/Risk/Verification: Rule-based (formulas, thresholds)
- Control Agent: LLM-powered (Claude/GPT-4) for complex multi-site decisions

---

## SUCCESS CRITERIA

**For judges (most important):**
- ✅ Can they open the app and immediately understand what to do?
- ✅ Can they click a site and adjust controls easily?
- ✅ Do they SEE agents responding autonomously?
- ✅ Is the multi-site coordination visible? (e.g., agent tells Site B to pause when Site A is loud)
- ✅ Does it feel like a real system (not a scripted demo)?
- ✅ Is the map impressive? (real Singapore, satellite view, smooth interactions)

**Technical:**
- ✅ Real-time WebSocket updates work smoothly
- ✅ Agents make decisions based on district-wide state
- ✅ 881 real HDB sites loaded from GeoJSON
- ✅ data.gov.sg integration functional
- ✅ UI is responsive and polished

---

## WHAT I NEED YOU TO BUILD

### Backend:
1. FastAPI server with WebSocket support
2. Load 881 HDB sites from GeoJSON file: `HDBUnderConstructionBuildings.geojson`
3. Implement 4 agents (Perception, Risk, Control, Verification)
4. Agent orchestration loop that runs continuously
5. API endpoints:
   - `GET /sites` - Get all 881 sites (or filtered subset) with current state
   - `POST /sites/{site_id}/control` - User adjusts site controls (noise, dust)
   - `GET /agents/status` - Current state of all 4 agents
   - `GET /metrics/district` - District-wide metrics
   - `WebSocket /ws` - Real-time updates stream
6. Integration with data.gov.sg APIs (fetch every 5 mins)
7. Multi-site coordination logic in Control Agent

### Frontend:
1. Interactive Mapbox map showing Singapore with 881 HDB sites
   - Satellite view using `mapbox://styles/mapbox/satellite-streets-v12`
   - Clickable site polygons from GeoJSON
   - Risk zone overlays
   - Smooth zoom/pan
2. Control panel (appears when site selected)
   - Sliders for noise/dust
   - Buttons for scenarios
   - Site info display (block number, postal code, area)
3. Agent status panel showing all 4 agents in real-time
4. Live metrics bar at top
5. Scrolling action log at bottom
6. WebSocket connection for real-time updates
7. Smooth animations and transitions (Framer Motion)
8. Distinctive "mission control" aesthetic (dark theme, professional)
9. Use frontend-design skill for polished UI

### Integration:
- Load the GeoJSON file into the backend
- Connect frontend controls to backend via WebSocket
- Agent decisions push to frontend immediately
- Map updates reflect agent actions (e.g., site color changes, risk zones appear)

---

## IMPLEMENTATION PRIORITY

1. **Backend foundation** (3-4 hours)
   - FastAPI setup, WebSocket working
   - Load 881 sites from GeoJSON
   - data.gov.sg API integration
   - Basic agent classes

2. **Map + site selection** (2-3 hours)
   - Get Mapbox working with 881 sites
   - Click to select, show controls
   - User can adjust sliders, see sensor updates

3. **Agent logic** (3-4 hours)
   - Implement agent decision loop
   - Multi-site coordination in Control Agent
   - Agents respond to user actions autonomously

4. **UI polish** (2-3 hours)
   - Agent status panel
   - Action log
   - Metrics display
   - Animations and visual feedback

5. **Testing & refinement** (2-3 hours)
   - Test site selection works smoothly
   - Test multi-site scenarios
   - Polish interactions
   - Fix bugs

**Total: 12-17 hours**

---

## GETTING STARTED

### Before You Build:

**1. Get Mapbox API Token (5 minutes):**
- Go to https://mapbox.com
- Sign up with email (no credit card needed)
- Dashboard → Access tokens → Copy your default public token
- Keep it ready for the frontend setup

**2. Prepare the Data:**
- GeoJSON file: `HDBUnderConstructionBuildings.geojson`
- Contains 881 real HDB construction sites across Singapore
- Each site has: Block number, postal code, coordinates, building area
- Load this into the backend on startup
- **Performance note:** If 881 sites cause lag, you can filter to ~100-200 most recent/largest sites. But try all 881 first - modern browsers can handle it!

---

## START BUILDING

Begin by:
1. Loading the GeoJSON file (881 sites) into the backend
2. Setting up Mapbox with satellite view
3. Making site selection work (click → show controls)
4. Getting user controls to update sensor data
5. Implementing basic agent loop (detect → decide → act)
6. Connecting everything via WebSocket

Focus on making it INTERACTIVE first. Agents can start simple and get smarter later.

The map is the centerpiece - make it beautiful and functional with all 881 sites visible.

---

## FILES PROVIDED

- `HDB Public Housing Building Under-Construction.geojson` - 82 real construction sites with exact coordinates and metadata
- `HDB Public Housing Building Under-Construction (KML).kml` - Same data in KML format (can use either)

---

Ready to build an interactive system that judges can actually PLAY with?

