# HDB Construction Orchestration AI System

**Hack for Cities 2026 | Singapore Management University**

An interactive, real-time multi-agent AI system that coordinates construction activities across Singapore's 82 real HDB construction sites to minimize environmental impact on residents.

---

## Quick Start

### Prerequisites
- Node.js 16+
- Python 3.8+
- Mapbox API token (free at [mapbox.com](https://mapbox.com))

### 1. Start the Backend
```bash
cd backend
pip install -r requirements.txt
python main.py
```
The server runs on `http://localhost:8000`

### 2. Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser

---

## What It Does

This system demonstrates **autonomous multi-agent AI coordination** for urban construction management:

1. **Interactive Map** - View all 82 real HDB construction sites on a satellite map of Singapore
2. **Manual Control** - Click any site and adjust noise/dust levels using sliders
3. **AI Response** - Watch 4 autonomous agents detect issues and coordinate responses across sites
4. **Real-Time Data** - Integrates live environmental data from data.gov.sg (PM2.5, temperature, humidity, wind, rainfall)

---

## How to Use (Demo Guide)

### Step 1: Explore the Map
- Pan and zoom around Singapore's construction sites
- Sites are color-coded:
  - **Green** = Normal (Noise <75dB, Dust <35 µg/m³)
  - **Yellow** = Elevated (Noise 75-85dB, Dust 35-50 µg/m³)
  - **Red** = High Impact (Noise >85dB, Dust >50 µg/m³)

### Step 2: Select a Site
- Click on any construction site polygon
- A control panel appears with site details

### Step 3: Simulate Construction Activity
- Use the **"Start Heavy Work"** button to simulate high noise/dust
- Or manually adjust sliders:
  - Pile-Driving Intensity (40-100 dB)
  - Excavation/Dust Level (0-100 µg/m³)

### Step 4: Watch the AI Respond
- **Perception Agent** (Blue) - Detects threshold violations
- **Risk Agent** (Green) - Calculates resident exposure risk
- **Control Agent** (Orange) - Coordinates multi-site response
- **Verification Agent** (Yellow) - Measures intervention effectiveness

### Step 5: Monitor the Dashboard
- **Top Bar** - District-wide metrics (max noise, PM2.5, affected residents, risk score)
- **Right Panel** - Real-time agent status and activity
- **Left Panel** - Scrolling log of all AI decisions

---

## Key Features

| Feature | Description |
|---------|-------------|
| **82 Real Sites** | Actual HDB construction sites from official GeoJSON data |
| **4 Autonomous Agents** | Perception, Risk, Control, and Verification agents working in coordination |
| **Real-Time WebSocket** | Instant updates between frontend and backend |
| **Live Environmental Data** | PM2.5, temperature, humidity, wind from data.gov.sg |
| **Interactive Controls** | Manual sliders with AI override toggle |
| **Mission Control UI** | Professional dark theme with smooth animations |

---

## Technology Stack

**Frontend:**
- React 18 + TypeScript
- Mapbox GL JS (satellite map)
- Framer Motion (animations)
- Tailwind CSS
- Vite

**Backend:**
- FastAPI (Python)
- WebSockets for real-time communication
- Async data fetching from data.gov.sg

---

## Architecture Overview

```
User clicks site → WebSocket → Backend State Update
                                      ↓
                              Agent Loop (every 3s)
                                      ↓
                   ┌─────────────────────────────────────┐
                   │  Perception → Risk → Control → Verify │
                   └─────────────────────────────────────┘
                                      ↓
                              Broadcast to all clients
                                      ↓
                              Frontend updates in real-time
```

---

## Project Structure

```
hfcofficial2026/
├── frontend/                    # React TypeScript UI
│   ├── src/
│   │   ├── App.tsx             # Main application
│   │   ├── components/         # Map, ControlPanel, AgentStatus, etc.
│   │   ├── hooks/              # WebSocket hook
│   │   └── types/              # TypeScript interfaces
│   └── package.json
│
├── backend/                     # FastAPI Python server
│   ├── main.py                 # API routes & WebSocket
│   ├── app/
│   │   ├── agents/             # 4 autonomous agents
│   │   ├── core/               # State management, data loading
│   │   └── models/             # Pydantic models
│   └── requirements.txt
│
└── HDBUnderConstructionBuildings.geojson  # Real site data
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sites` | GET | All construction sites as GeoJSON |
| `/sites/{id}/control` | POST | Update site noise/dust levels |
| `/agents/status` | GET | Current status of all 4 agents |
| `/metrics/district` | GET | District-wide environmental metrics |
| `/ws` | WebSocket | Real-time bidirectional updates |

---

## Innovation Highlights

1. **Interactive Demo** - Not a scripted presentation; judges can manipulate the system live
2. **Multi-Agent Coordination** - Agents communicate and coordinate across multiple sites
3. **Real Data Integration** - Uses actual HDB sites and live government environmental APIs
4. **Immediate Visual Feedback** - Every action shows instant results on the map and dashboard
5. **Practical Urban Application** - Addresses real challenges in Singapore's construction management

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Map not loading | Check Mapbox token in frontend config |
| Backend connection failed | Ensure backend is running on port 8000 |
| No site data | Verify GeoJSON file exists in root directory |
| WebSocket disconnected | Refresh the page to reconnect |

---

## Team

**Branch:** Maki

---

*Built for Hack for Cities 2026*
