# Interactive Construction Orchestration AI - Hack for Cities 2026

## Project Overview
An interactive web application where users can manually control 82 HDB construction sites on a real Singapore satellite map and watch 4 AI agents respond autonomously to coordinate district-wide pollution and noise management.

## Key Innovation
Multi-site orchestration - when Site A becomes noisy, agents coordinate across the district: pause Site B, increase dust suppression at Site C, notify affected residents. This district-level coordination exceeds human cognitive capacity.

## Data Sources
- **82 HDB Construction Sites**: `HDBUnderConstructionBuildings.geojson` with exact polygon coordinates, site names, construction dates, contractor info
- **Singapore Environmental APIs** (data.gov.sg):
  - PM2.5: `https://api.data.gov.sg/v1/environment/pm25`
  - Temperature: `https://api.data.gov.sg/v1/environment/air-temperature`
  - Humidity: `https://api.data.gov.sg/v1/environment/relative-humidity`
  - Rainfall: `https://api.data.gov.sg/v1/environment/rainfall`
  - Wind: `https://api.data.gov.sg/v1/environment/wind-speed`

## The 4 Autonomous Agents

### 1. Perception Agent
- Monitors sensor data from all sites continuously
- Detects threshold breaches (noise > 75dB, PM2.5 > 35)
- Identifies patterns across multiple sites
- Triggers Risk Agent when problems detected

### 2. Risk & Impact Agent
- Calculates "Resident Exposure Risk Score" for entire district
- Considers: duration, intensity, time-of-day, proximity to HDB blocks
- Accounts for cumulative burden (multiple nearby sites)
- Creates spatial risk map

### 3. Control & Policy Agent
- Makes autonomous multi-site decisions
- Coordinates actions: increase suppression, pause sites, send notifications
- Uses LLM reasoning for complex coordination
- Executes without human approval

### 4. Verification & Learning Agent
- Measures effectiveness of control actions
- Compares before/after sensor readings
- Learns which strategies work best
- Adapts future responses

## Technical Stack

### Backend (Python)
- FastAPI with WebSocket support
- Multi-agent orchestration (LangGraph/CrewAI)
- SQLite for decisions/actions/history
- HTTPX for data.gov.sg APIs

### Frontend (React/TypeScript)
- Mapbox GL JS with satellite view (`mapbox://styles/mapbox/satellite-streets-v12`)
- Tailwind CSS styling
- Framer Motion animations
- WebSocket client for real-time updates
- React Query for data fetching

## API Endpoints
- `GET /sites` - All sites with current state
- `POST /sites/{site_id}/control` - User adjusts controls
- `GET /agents/status` - Current agent states
- `GET /metrics/district` - District-wide metrics
- `WebSocket /ws` - Real-time updates stream

## UI Layout
1. **Map View (60%)**: Satellite map with 82 site polygons, color-coded by state (green/yellow/red)
2. **Control Panel (20%)**: Site info, noise/dust sliders, action buttons
3. **Agent Status Panel (15%)**: 4 agents with real-time status
4. **Metrics Bar (5%)**: District-wide stats (noise, PM2.5, weather)
5. **Action Log**: Scrolling timeline of agent decisions

## User Interaction Flow
1. User opens app, sees satellite map with 82 construction sites
2. User clicks a site, control panel appears with sliders
3. User adjusts noise/dust levels, site color changes
4. AI agents detect changes and respond autonomously
5. Agent actions visible in status panel and action log
6. Map shows coordinated actions across multiple sites

## Site State Colors
- Green: Normal operation (<75dB)
- Yellow: Elevated (75-85dB)
- Red: High impact (>85dB)
- Blue outline: Currently selected

## Success Criteria
- Judges can immediately understand and interact

