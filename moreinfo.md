# UrbanPulse AI — Presentation Guide

A reference guide for understanding every number, metric, and visual across all tabs. 

---

## What Is UrbanPulse AI?

A multi-agent AI system that monitors HDB construction sites across Singapore and coordinates between them to reduce cumulative noise and dust impact on nearby residents. The key insight is that when multiple construction sites operate near the same residential blocks, their combined impact is far worse than any single site — and no human supervisor manages across sites. UrbanPulse does.

**The 4 AI Agents:**

| Agent | Role | Real-World Analogy |
|-------|------|--------------------|
| Perception | Detects when noise or dust crosses safety thresholds | A sensor network operator watching dashboards 24/7 |
| Risk | Assesses cumulative impact when nearby sites spike together | A district planner who sees the big picture across all sites |
| Control | Issues directives — stagger schedules, reduce intensity, activate suppression | A site coordinator making calls to contractors |
| Verification | Confirms mitigations actually worked | A QA inspector checking post-action readings |

---

## MAP TAB

### What You See

| Element | What It Means | Data Source |
|---------|--------------|-------------|
| Green site polygons | Site is operating within safe limits (noise < 75dB, dust < 35 ug/m3) | Real HDB construction site boundaries from official GeoJSON data |
| Yellow site polygons | Elevated — approaching limits (noise 75-85dB or dust 35-50 ug/m3) | Calculated from site noise/dust values using threshold logic |
| Red site polygons | High impact — exceeding limits (noise > 85dB or dust > 50 ug/m3) | Same threshold logic |
| Glow aura around sites | Visual emphasis — larger and brighter glow = worse state | Purely visual, scales with site state |
| Construction Sites count (bottom-left) | Total number of HDB sites being monitored | Real — counted from the GeoJSON file |
| Connected/Reconnecting (top-left) | Whether the frontend has a live WebSocket to the backend | Real — actual connection state |
| Site control panel (click a site) | Sliders to simulate construction activity at that site | Functional — sends real updates to backend, recalculates all metrics |
| Pile-Driving Intensity slider | Simulates noise level (dB) at the selected site | Functional — changes site state in real-time |
| Excavation Dust slider | Simulates dust level (ug/m3) at the selected site | Functional |
| Dust Suppression slider | Simulates water misting effectiveness (%) | Functional — when AI-controlled, the agent manages this automatically |
| AI Controlled / Manual toggle | Whether the AI agents can adjust this site's dust suppression | Functional — toggling to Manual lets you control suppression yourself |
| Start Heavy Work button | Sets noise to 90dB and dust to 60 ug/m3 to trigger agent response | Functional — triggers the full agent shuffle cycle |
| AI Agents panel (right side) | Shows each agent's current status and what it's doing | Real — status updates come from backend agent processing cycle |
| Agent card glow + shuffle to top | The active agent gets highlighted and moves to top of the list | Real — driven by which agent is currently processing |
| Action Log (left side) | Chronological feed of every action taken by agents | Real — every agent decision is logged with timestamp |

### How Site State Is Calculated

```
If noise > 85dB OR dust > 50 ug/m3 => HIGH IMPACT (red)
If noise > 75dB OR dust > 35 ug/m3 => ELEVATED (yellow)
Otherwise => NORMAL (green)
```

These thresholds are based on NEA (National Environment Agency) guidelines for construction noise and PM2.5 limits in residential areas.

### How The Demo Works

The demo compresses a real-world 1-2 hour agent coordination cycle into ~18 seconds:

1. **Spike (0-3s)** — Site A noise jumps to 92dB (critical), Site B already at 78dB (elevated). Map zooms into the affected cluster.
2. **Detect (3-6s)** — Risk Agent flags the cumulative impact: two nearby sites both elevated = compounded harm to residents between them.
3. **Coordinate (6-10s)** — Control Agent sends directives: stagger piling at A & B, activate dust suppression at C. Wave animations show signals traveling between sites.
4. **Mitigate (10-15s)** — Sites respond: A drops from 92 to 62dB, B from 78 to 55dB, C activates 90% suppression. Site colors change from red/yellow to green.
5. **Verify (15-18s)** — Verification Agent confirms: 33% noise reduction achieved, all sites within acceptable limits.
6. **Complete (18s)** — Alert created for Town Council review, CSV row logged, map zooms back out.

### Current Limitations

- Site locations are real (from HDB open data), but sensor readings (noise, dust) are simulated via sliders and demo sequences — no live sensor hardware.
- The agent processing cycle runs every 5 seconds in the backend, making small adjustments. The demo is a scripted dramatic sequence to show the concept clearly.

### With Real Resources

- **NEA real-time air quality API** — PM2.5 readings would replace simulated dust levels, giving actual environmental baselines.
- **IoT noise sensors** (deployed at each site) — real decibel readings streamed via MQTT/WebSocket would replace slider-simulated values.
- **IoT dust sensors** — real-time PM2.5/PM10 readings per site.
- **Weather API (e.g. data.gov.sg)** — wind direction and speed would feed into the Risk Agent to predict where dust travels (e.g. "NE wind carrying particulates toward Blk 201-205").
- **BCA construction schedule API** — real piling/demolition schedules would let the system predict impacts before they happen, not just react.
- **HDB resident complaint data** — could validate that AI mitigations actually reduce complaints over time.

---

## ORCHESTRATION TAB

### What You See

| Element | What It Means | Data Source |
|---------|--------------|-------------|
| Cluster list (left panel) | Groups of construction sites within 500m of each other | Real — computed using spatial clustering algorithm on actual site coordinates |
| Cluster severity (Critical/Warning/Normal) | Worst state among any site in the cluster | Real — derived from actual site states |
| Site count per cluster | How many sites are in that geographic cluster | Real |
| SVG diagram (center) | Visual representation of 3 sites in the selected cluster showing their states and relationships | Real site data — names, noise levels, and states come from backend |
| Site circles (A, B, C) | The top 3 sites in the cluster, color-coded by state | Real |
| dB readings under each circle | Current noise level at that site | Real — updates live during demo |
| HDB block squares | Represents residential blocks affected between the sites | Visual representation (not mapped to specific real blocks) |
| Shockwave rings (red, spike phase) | Noise impact radiating from the breaching site | Animation only — shows the concept of noise propagation |
| Scanning arc (yellow, detect phase) | Risk Agent analyzing the area | Animation only |
| Blue wave beams (coordinate phase) | Control signals traveling from Site A to B and C | Animation — represents inter-site coordination directives |
| Green pulses (verify phase) | All sites confirmed within safe limits | Animation |
| Before/After card (right panel, verify phase) | Shows 92dB before vs 62dB after mitigation | Real values from demo sequence |
| Phase indicator banner | Current stage of the agent coordination cycle | Real — driven by demo phase state |
| "Real-time cycle: ~1-2 hrs / Demo compressed to 18s" | Explains the time compression | Static label |
| Start Demo / Reset Demo buttons | Triggers the backend demo sequence | Functional |

### How Clustering Works

Sites are grouped using a grid-based spatial algorithm:
- Divide Singapore into grid cells (~500m)
- Sites in the same or neighboring cells that are within 500m of each other get grouped
- Only clusters with 2+ sites are shown (single isolated sites are not clusters)
- The cluster name is auto-generated from the first two site names (e.g. "Blk 811A — Blk 811B Corridor")

### Current Limitations

- The SVG diagram always shows exactly 3 sites (the top 3 by polygon area in the cluster). Clusters with more sites only display 3.
- Wave/signal animations are visual representations of the coordination concept — they don't map to actual network packets.
- The demo always picks the same cluster (Kembangan/Blk 811 area) as the demo target.

### With Real Resources

- **Real-time site-to-site communication** — actual coordination messages between site IoT controllers, not just animated waves.
- **Live cluster severity** — would update continuously as real sensor data streams in, not just during demos.
- **Historical playback** — with stored sensor data, you could replay past incidents and show how the AI would have (or did) respond.
- **More sophisticated clustering** — factor in wind direction, building heights, and resident density to determine which clusters truly share impact zones.

---

## TOWN COUNCIL TAB

### What You See

**Left Side — Alert Feed (60%)**

| Element | What It Means | Data Source |
|---------|--------------|-------------|
| Each alert card | A situation requiring Town Council awareness or approval | 3 pre-seeded on startup + new ones generated by each demo run |
| Severity badge (CRITICAL/WARNING/MODERATE) | How urgent the situation is | Based on the triggering conditions |
| Cluster name | Which geographic cluster of sites is affected | From the clustering algorithm |
| Recommendation text | What the AI suggests doing | Generated by the demo/alert system |
| Affected blocks | Which HDB blocks are impacted | From the alert data (site names in the cluster) |
| Resident count | Estimated residents in affected blocks | Estimated: (elevated + high_impact sites) x 3 blocks x 400 residents per block |
| Approve button | Town Council agrees with the AI recommendation | Functional — updates alert status, syncs to CSV |
| Override button | Town Council rejects the AI recommendation | Functional — updates alert status, syncs to CSV |
| Status (approved/overridden/pending) | Current decision state | Real — persists in backend |

**Right Side — Impact Report (40%)**

| Element | What It Means | Data Source | Accurate? |
|---------|--------------|-------------|-----------|
| Disruptions Detected | Total number of alerts in the system | `alerts.length` | Yes — real count |
| Mitigations Executed | Number of AI mitigation actions completed | Hardcoded formula: `max(alerts - 1, 5)` — always shows at least 5 | No — not tied to actual mitigations |
| Avg Impact Reduction: 32% | Average effectiveness of AI actions | Hardcoded string "32%" | No — never changes. Actual CSV data averages ~34% (28%, 29%, 38%, 42%, 33%) |
| Directives Approved | How many alerts the council has approved | Count of alerts with status "approved" | Yes — real count |
| Decision Log table | Timeline of all alerts with their status | Renders directly from alerts array | Yes |
| Download Report (CSV) button | Downloads a detailed CSV with all incident data | Functional — generates from backend AlertStore | Yes — contains real + pre-seeded data |

### What The CSV Contains

Each row in the downloaded CSV represents one incident:

| Column | Meaning |
|--------|---------|
| Date / Time | When the incident occurred |
| Cluster | Which site cluster was affected |
| Triggering Site | The specific site that breached thresholds |
| Violation Type | What went wrong (e.g. "Noise > 85dB", "Dust > 50ug/m3", "Cumulative Noise Risk") |
| Affected HDB Blocks | Residential blocks in the impact zone |
| Est. Residents Affected | Estimated number of residents impacted |
| AI Action Taken | What the AI did (e.g. "Reduced piling intensity, activated noise barriers") |
| Directive Sent To | Which agents were involved (e.g. "Perception -> Risk -> Control -> Verification") |
| Impact Score Before | Severity reading before AI intervention |
| Impact Score After | Severity reading after AI intervention |
| Reduction % | Percentage improvement |
| Town Council Decision | Approved / Overridden / Pending |
| Status | Mitigated / Resolved |

The CSV starts with 5 pre-seeded rows and grows by 1 each time a demo completes.

### Pre-Seeded Alerts (on startup)

| Alert | Severity | Scenario |
|-------|----------|----------|
| Ang Mo Kio — Bishan Corridor | Warning | Two sites doing heavy piling simultaneously — recommends staggering to 2-hour alternating schedule |
| Tampines West Cluster | Moderate | Dust being carried by NE wind toward residential zone — recommends increasing water misting by 40% |
| Woodlands North Zone | Critical | Demolition site at 94dB, exceeding NEA limit of 75dB during residential hours — recommends noise barriers + switching to hydraulic breaking |

These exist so the tab isn't empty on first load. They represent realistic scenarios.

### Current Limitations

- The 3 initial alerts are hardcoded demo data, not generated from real sensor readings.
- "Mitigations Executed" and "Avg Impact Reduction" are not computed from actual data.
- Resident counts are estimated using a formula (sites x 3 blocks x 400 residents), not real population data.

### With Real Resources

- **NEA noise/dust violation API** — alerts would be auto-generated when real sensors detect breaches, not pre-seeded.
- **HDB population database** — accurate resident counts per block instead of estimates.
- **Town Council integration** — approve/override decisions could trigger actual work orders to contractors via BCA systems.
- **Historical incident database** — track patterns over weeks/months to show the AI learning and improving response times.
- **Push notifications** — alert Town Council officers on their phones when critical situations arise, not just in this dashboard.
- **Mitigations Executed and Avg Impact Reduction** — would be dynamically calculated from real intervention records. Every time the AI successfully reduces noise/dust at a site, it logs the before/after readings. The dashboard would compute actual averages from this data.

---

## ANALYTICS TAB

### What You See

| Element | What It Means | Data Source | Accurate? |
|---------|--------------|-------------|-----------|
| Construction Density Heatmap | Visual showing where construction is concentrated across Singapore | Random colored dots — purely decorative | No — placeholder visualization |
| "X sites monitored" (top right of heatmap) | Total construction sites in the system | Real count from GeoJSON | Yes |
| Activity Distribution chart | Breakdown of what types of work sites are doing | Hardcoded: Excavation 234, Concrete 187, Piling 142, Finishing 156, Demolition 89, Idle 73 | No — static data, never changes |
| Cluster Status — Critical count | Clusters where at least one site is in high_impact state | Computed from real cluster data | Yes |
| Cluster Status — Warning count | Clusters where worst site is elevated | Computed from real cluster data | Yes |
| Cluster Status — Moderate count | Clusters where all sites are normal | Computed from real cluster data | Yes |
| Cluster Status — Resolved count | Supposedly clusters that returned to normal | Hardcoded: `max(total - critical - warning, 3)` — always at least 3 | No — formula, not tracked |
| Data Sources list | External data feeds the system consumes | Hardcoded list with static "updated X ago" timestamps | No — never updates |
| Total Decisions: 1,247 | Total agent decisions made | Hardcoded string | No |
| Actions Deployed: 438 | Total mitigation actions executed | Hardcoded string | No |
| Avg Impact Reduction: 32% | Average effectiveness across all interventions | Hardcoded string | No |
| Avg Response Time: 2.4s | How fast the AI responds to incidents | Hardcoded string | No |
| Sites Monitored | Total construction sites | Real count from GeoJSON | Yes |

### What The Numbers Would Mean In Production

- **Total Decisions: 1,247** — Every 5 seconds, each of the 4 agents evaluates all sites. Over a day that's ~69,120 evaluation cycles. "1,247" would represent cycles where an agent actually decided to take action (not just "all clear").
- **Actions Deployed: 438** — Subset of decisions where the Control Agent issued an actual directive (reduce noise, increase suppression, stagger schedule). Not every decision leads to action.
- **Avg Impact Reduction: 32%** — Across all interventions, the average improvement in noise/dust readings after the AI acted. A 32% reduction would mean if noise was 90dB, AI brought it down to ~61dB on average.
- **Avg Response Time: 2.4s** — Time from Perception Agent detecting a breach to Control Agent issuing a directive. In our demo this happens in the processing cycle (~5s intervals). With real-time sensors, sub-3-second response would be achievable.

### Data Sources — What They Represent

| Source | What It Would Provide |
|--------|----------------------|
| NEA Air Quality (PM2.5) | Real-time PM2.5 readings from Singapore's air quality monitoring network |
| NEA Noise Monitoring | Noise level data from NEA monitoring stations near construction zones |
| Weather (Temperature) | Ambient temperature affecting dust dispersion and worker safety |
| Weather (Humidity) | High humidity helps suppress dust naturally; low humidity = worse dust |
| Weather (Wind Speed) | Determines how far dust/noise carries toward residential blocks |
| HDB Construction Sites | The actual site boundaries, contractors, and project status from HDB/BCA |

### Current Limitations

- The Analytics tab is primarily a presentation/mockup. Most values are static to show what the dashboard would look like at scale.
- The heatmap is decorative random dots, not a real spatial visualization.
- Activity distribution data (Excavation, Piling, etc.) has no backend source — the GeoJSON doesn't include activity type information.
- Agent performance metrics are hardcoded to show plausible production-scale numbers.

### With Real Resources

- **Real heatmap** — plot actual site coordinates on a mini-map with density coloring. Areas with many overlapping sites (e.g. Tampines, Woodlands) would glow red.
- **BCA project data API** — would provide what phase each site is in (excavation, piling, concrete, finishing), making the Activity Distribution chart real.
- **Time-series database (e.g. InfluxDB)** — store every agent decision and action with timestamps. Total Decisions, Actions Deployed, and Response Time would be live aggregations.
- **Before/after sensor readings** — every intervention gets logged with pre and post readings, giving a true Avg Impact Reduction.
- **Data source health monitoring** — actual API status checks showing real uptime and last-updated timestamps instead of static "2m ago".
- **Trend charts** — with historical data, show how impact reduction improves over time as the AI learns site patterns.

---

## METRICS BAR (Top Bar — Visible On All Tabs)

The metrics bar at the top of every tab shows district-wide summary numbers.

| Metric | What It Means | How It's Calculated | Accurate? |
|--------|--------------|---------------------|-----------|
| Max Noise | Highest noise reading across all sites | Scans all sites, returns the maximum `noise_level` | Yes |
| Max Noise Site | Which site has the highest noise | Name of the site with max noise | Yes |
| Total PM2.5 | Combined air quality reading | `baseline_pm25 (from NEA API) + construction_pm25 (from sites)` | Yes — baseline is from real NEA API, construction contribution is calculated |
| Baseline PM2.5 | Background air quality without construction | Fetched from NEA real-time API (data.gov.sg) | Yes — real API call |
| Construction PM2.5 | Additional dust from construction sites | Average of `dust_level x (1 - suppression x 0.5)` across all sites | Yes — calculated from site values |
| Elevated Sites | Sites in yellow state | Count of sites where state = "elevated" | Yes |
| High Impact Sites | Sites in red state | Count of sites where state = "high_impact" | Yes |
| Affected Residents | Estimated people impacted | `(elevated + high_impact) x 3 blocks x 400 residents` | Estimate — not real population data |
| Risk Score (0-10) | Overall district risk level | `min(10, elevated x 0.5 + high_impact x 1.5)` | Yes — formula-based |
| Environment data (temp, humidity, wind, rainfall) | Current weather conditions | Fetched from data.gov.sg weather APIs | Yes — real API data, updates every 5 minutes |

### Current Limitations

- Environment data (temperature, humidity, wind, rainfall) is real — fetched from Singapore's data.gov.sg APIs.
- PM2.5 baseline is real — fetched from NEA's air quality API.
- Construction PM2.5 contribution is calculated from simulated site dust levels, not real dust sensors.
- Affected residents uses a rough formula, not actual HDB population data.

### With Real Resources

- **Per-site IoT dust sensors** — construction PM2.5 would be measured, not estimated from slider values.
- **HDB resident database** — exact population counts per block for accurate affected-resident numbers.
- **Multi-point PM2.5 sensors** — instead of one district average, show per-cluster air quality readings.

---

## QUICK REFERENCE — What's Real vs Demo Data

### Confirmed Real Data
- HDB construction site locations and boundaries (from official GeoJSON)
- NEA PM2.5 baseline reading (from data.gov.sg API)
- Temperature, humidity, wind speed, rainfall (from data.gov.sg API)
- Site count
- Cluster groupings (computed from real site coordinates)

### Functional Simulation (Works But Uses Simulated Inputs)
- Site noise/dust levels (controlled via sliders or demo, not real sensors)
- Site state calculation (real threshold logic, simulated input values)
- Agent processing cycle (real agent code running every 5 seconds)
- Demo sequence (scripted but functional end-to-end)
- Alert creation, approval, override (fully working system)
- CSV report generation and download (working, grows with usage)
- Cluster severity (real algorithm, simulated site states)
- Risk score calculation (real formula, simulated inputs)
- Affected residents estimate (real formula, estimated multipliers)

### Static
- Analytics tab: Activity Distribution chart numbers
- Analytics tab: Construction Density Heatmap (random dots)
- Analytics tab: Total Decisions (1,247), Actions Deployed (438), Avg Response Time (2.4s)
- Analytics tab: Data Sources "updated X ago" timestamps
- Analytics tab: Resolved cluster count (minimum 3)
- Town Council: Mitigations Executed (formula, not tracked)
- Town Council + Analytics: Avg Impact Reduction (hardcoded "32%")
- Town Council: 3 pre-seeded alerts on startup

---
