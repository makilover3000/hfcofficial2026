import asyncio
import math
from datetime import datetime
from typing import Dict, Any, List, Callable, Awaitable
from collections import defaultdict


def find_demo_sites(sites: Dict[str, Any], count: int = 3) -> tuple[List[str], str, list[float]]:
    """Find the best 3 sites from the Kembangan (Blk 811) cluster for the demo.
    Returns (site_ids, cluster_name, cluster_center)."""
    # Build clusters using grid-based spatial grouping
    radius_km = 0.5
    cell_size = radius_km / 111.0
    grid: Dict[tuple, List[str]] = {}

    for sid, site in sites.items():
        c = site.get('centroid', [0, 0])
        cell = (int(c[0] / cell_size), int(c[1] / cell_size))
        grid.setdefault(cell, []).append(sid)

    visited = set()
    all_clusters: List[List[str]] = []
    target_cluster_idx = -1

    for sid in sites:
        if sid in visited:
            continue
        cluster = [sid]
        visited.add(sid)
        queue = [sid]

        while queue:
            current_id = queue.pop(0)
            c1 = sites[current_id].get('centroid', [0, 0])
            cx, cy = int(c1[0] / cell_size), int(c1[1] / cell_size)

            for dx in range(-1, 2):
                for dy in range(-1, 2):
                    for other_id in grid.get((cx + dx, cy + dy), []):
                        if other_id in visited:
                            continue
                        c2 = sites[other_id].get('centroid', [0, 0])
                        lat_diff = abs(c1[1] - c2[1]) * 111
                        lon_diff = abs(c1[0] - c2[0]) * 111 * math.cos(math.radians(c1[1]))
                        if math.sqrt(lat_diff ** 2 + lon_diff ** 2) < radius_km:
                            visited.add(other_id)
                            cluster.append(other_id)
                            queue.append(other_id)

        all_clusters.append(cluster)
        # Check if this cluster contains the Kembangan Blk 811 sites
        for s in cluster:
            if '811' in sites[s].get('name', ''):
                target_cluster_idx = len(all_clusters) - 1

    # Use the Kembangan cluster if found, otherwise fall back to largest
    if target_cluster_idx >= 0:
        best_cluster = all_clusters[target_cluster_idx]
    else:
        best_cluster = max(all_clusters, key=len) if all_clusters else list(sites.keys())[:count]

    if len(best_cluster) < count:
        best_cluster = list(sites.keys())[:count]

    # Pick 3 sites, sorted by polygon area (largest first = Site A turns red)
    def polygon_area(sid):
        """Approximate polygon area using the shoelace formula."""
        geom = sites[sid].get('geometry', {})
        coords = geom.get('coordinates', [])
        # Get outer ring
        if geom.get('type') == 'MultiPolygon':
            ring = coords[0][0] if coords and coords[0] else []
        else:
            ring = coords[0] if coords else []
        if len(ring) < 3:
            return 0
        area = 0
        for i in range(len(ring)):
            j = (i + 1) % len(ring)
            area += ring[i][0] * ring[j][1]
            area -= ring[j][0] * ring[i][1]
        return abs(area) / 2

    best_cluster.sort(key=polygon_area, reverse=True)
    selected = best_cluster[:count]

    # Compute cluster center and name
    lngs = [sites[s].get('centroid', [0, 0])[0] for s in best_cluster]
    lats = [sites[s].get('centroid', [0, 0])[1] for s in best_cluster]
    center = [sum(lngs) / len(lngs), sum(lats) / len(lats)]

    names = [sites[s].get('name', s) for s in selected[:2]]
    cluster_name = ' — '.join(names) + ' Corridor'

    print(f"Demo: selected {len(selected)} sites from cluster of {len(best_cluster)} ({cluster_name})")
    return selected, cluster_name, center


class DemoRunner:
    def __init__(self):
        self.running = False
        self.demo_sites: List[str] = []
        self.baseline_values: Dict[str, Dict[str, Any]] = {}

    async def start(
        self,
        sites: Dict[str, Any],
        broadcast: Callable[[Dict[str, Any]], Awaitable[None]],
        update_site: Callable[[str, Dict[str, Any]], Any],
        update_metrics: Callable[[], None],
        get_sites_for_map: Callable[[], Dict[str, Any]],
        get_metrics_dump: Callable[[], Dict[str, Any]],
        alert_store: Any,
        get_alerts: Callable[[], List[Dict[str, Any]]],
        get_clusters: Callable[[], List[Dict[str, Any]]] = None,
        add_log: Callable[[Dict[str, Any]], None] = None,
        get_logs: Callable[[], List] = None
    ):
        if self.running:
            return
        self.running = True

        # Find the 3 best demo sites from the largest cluster
        self.demo_sites, self.cluster_name, self.cluster_center = find_demo_sites(sites)
        if len(self.demo_sites) < 3:
            self.running = False
            return

        site_a, site_b, site_c = self.demo_sites

        # Save baseline values for reset
        for sid in self.demo_sites:
            s = sites[sid]
            self.baseline_values[sid] = {
                'noise_level': s.get('noise_level', 45.0),
                'dust_level': s.get('dust_level', 15.0),
                'dust_suppression': s.get('dust_suppression', 50.0),
                'state': s.get('state', 'normal')
            }

        try:
            # Resolve site names for log messages
            site_a_name = sites[site_a].get('name', site_a)
            site_b_name = sites[site_b].get('name', site_b)
            site_c_name = sites[site_c].get('name', site_c)

            # Phase 1: SPIKE (0-3s) — Site A noise spikes, Site B already elevated
            # This shows the CUMULATIVE problem: one red + one yellow = compounded impact on residents
            update_site(site_a, {'noise_level': 92, 'dust_level': 55})
            update_site(site_b, {'noise_level': 78, 'dust_level': 38})
            update_metrics()
            if add_log:
                add_log({
                    'agent': 'Perception', 'icon': '🔵', 'type': 'threshold_breach',
                    'message': f'Noise spike detected: {site_a_name} at 92dB (critical), {site_b_name} elevated at 78dB',
                    'site_id': site_a, 'site_name': site_a_name
                })
            await broadcast({
                'type': 'demo_event',
                'demo': {'phase': 'spike', 'site_id': site_a, 'demo_site_ids': self.demo_sites, 'cluster_center': self.cluster_center},
                'sites': get_sites_for_map(),
                'metrics': get_metrics_dump(),
                'logs': get_logs() if get_logs else [],
                'clusters': get_clusters() if get_clusters else None
            })
            await asyncio.sleep(3)

            if not self.running:
                return

            # Phase 2: DETECT (3-6s) — Risk agent assesses cumulative impact
            if add_log:
                add_log({
                    'agent': 'Risk', 'icon': '🟢', 'type': 'cumulative_risk',
                    'message': f'Cumulative impact assessment: {site_a_name} (92dB) + {site_b_name} (78dB) exceeding district threshold for {self.cluster_name}',
                    'site_id': site_a, 'site_name': site_a_name
                })
            await broadcast({
                'type': 'demo_event',
                'demo': {'phase': 'detect', 'demo_site_ids': self.demo_sites},
                'sites': get_sites_for_map(),
                'metrics': get_metrics_dump(),
                'logs': get_logs() if get_logs else [],
                'clusters': get_clusters() if get_clusters else None
            })
            await asyncio.sleep(3)

            if not self.running:
                return

            # Phase 3: COORDINATE (6-10s) — Control fires, wave signals
            await broadcast({
                'type': 'coordination_signal',
                'signal': {
                    'from_site_id': site_a,
                    'to_site_id': site_b,
                    'action': 'reduce_noise',
                    'message': 'Site B already at 78dB — stagger piling to reduce cumulative impact on residents'
                }
            })
            await asyncio.sleep(1)
            await broadcast({
                'type': 'coordination_signal',
                'signal': {
                    'from_site_id': site_a,
                    'to_site_id': site_c,
                    'action': 'activate_suppression',
                    'message': 'Activate dust suppression — wind carrying particulates NE'
                }
            })
            if add_log:
                add_log({
                    'agent': 'Control', 'icon': '🟠', 'type': 'control_action',
                    'message': f'Issuing coordination directives: stagger piling at {site_a_name} & {site_b_name}, activate dust suppression at {site_c_name}',
                    'site_id': site_a, 'site_name': site_a_name
                })
            await broadcast({
                'type': 'demo_event',
                'demo': {'phase': 'coordinate', 'demo_site_ids': self.demo_sites},
                'sites': get_sites_for_map(),
                'metrics': get_metrics_dump(),
                'logs': get_logs() if get_logs else [],
                'clusters': get_clusters() if get_clusters else None
            })
            await asyncio.sleep(3)

            if not self.running:
                return

            # Phase 4: MITIGATE (10-15s) — Site B & C respond
            update_site(site_b, {'noise_level': 55, 'dust_level': 20, 'dust_suppression': 85})
            update_site(site_c, {'noise_level': 50, 'dust_level': 18, 'dust_suppression': 90})
            update_site(site_a, {'noise_level': 62, 'dust_level': 28, 'dust_suppression': 80})
            update_metrics()
            if add_log:
                add_log({
                    'agent': 'Control', 'icon': '🟠', 'type': 'control_action',
                    'message': f'Mitigation applied: {site_a_name} 92→62dB, {site_b_name} 78→55dB, {site_c_name} dust suppression at 90%',
                    'site_id': site_a, 'site_name': site_a_name
                })
            await broadcast({
                'type': 'demo_event',
                'demo': {'phase': 'mitigate', 'demo_site_ids': self.demo_sites},
                'sites': get_sites_for_map(),
                'metrics': get_metrics_dump(),
                'logs': get_logs() if get_logs else [],
                'clusters': get_clusters() if get_clusters else None
            })
            await asyncio.sleep(5)

            if not self.running:
                return

            # Phase 5: VERIFY (15-18s) — Verification confirms reduction
            if add_log:
                add_log({
                    'agent': 'Verification', 'icon': '🟡', 'type': 'verification',
                    'message': f'Confirmed reduction at {site_a_name}: 92→62dB (33% decrease). All sites within acceptable thresholds.',
                    'site_id': site_a, 'site_name': site_a_name
                })
            await broadcast({
                'type': 'demo_event',
                'demo': {
                    'phase': 'verify',
                    'before': 92,
                    'after': 62,
                    'reduction_pct': 33,
                    'demo_site_ids': self.demo_sites
                },
                'sites': get_sites_for_map(),
                'metrics': get_metrics_dump(),
                'logs': get_logs() if get_logs else [],
                'clusters': get_clusters() if get_clusters else None
            })
            await asyncio.sleep(3)

            if not self.running:
                return

            # Phase 6: COMPLETE (18s) — Create alert + CSV row
            if add_log:
                add_log({
                    'agent': 'Verification', 'icon': '🟡', 'type': 'effectiveness',
                    'message': f'Demo cycle complete: autonomous multi-agent coordination resolved cumulative noise impact across {self.cluster_name}',
                    'site_id': site_a, 'site_name': site_a_name
                })

            new_alert = alert_store.add_alert({
                'severity': 'warning',
                'cluster_name': self.cluster_name,
                'recommendation': f'Autonomous coordination completed: Cumulative impact detected — {site_a_name} at 92dB (critical) + {site_b_name} at 78dB (elevated). AI reduced all sites: {site_a_name} 92→62dB, {site_b_name} 78→55dB. ↓33% peak reduction. Recommend continued monitoring.',
                'affected_blocks': [site_a_name, site_b_name, site_c_name],
                'resident_count': 2400,
            })

            alert_store.add_csv_row({
                'date_time': datetime.now().strftime('%Y-%m-%d %H:%M'),
                'cluster': self.cluster_name,
                'triggering_site': site_a_name,
                'violation_type': 'Cumulative: Site A 92dB + Site B 78dB exceeding district threshold',
                'affected_hdb_blocks': f'{site_a_name}, {site_b_name}, {site_c_name}',
                'est_residents_affected': 2400,
                'ai_action_taken': 'Autonomous: Detected cumulative impact, reduced piling at A & B, staggered schedules, activated dust suppression at C',
                'directive_sent_to': 'Perception → Risk → Control → Verification',
                'impact_score_before': 92,
                'impact_score_after': 62,
                'reduction_pct': 33,
                'town_council_decision': 'Pending',
                'status': 'Mitigated'
            })

            await broadcast({
                'type': 'demo_event',
                'demo': {'phase': 'complete', 'demo_site_ids': self.demo_sites},
                'sites': get_sites_for_map(),
                'metrics': get_metrics_dump(),
                'alerts': get_alerts(),
                'logs': get_logs() if get_logs else [],
                'clusters': get_clusters() if get_clusters else None
            })

        except asyncio.CancelledError:
            pass
        finally:
            self.running = False

    def reset(self, sites: Dict[str, Any], update_site_fn: Callable, update_metrics_fn: Callable):
        self.running = False
        for sid, baseline in self.baseline_values.items():
            if sid in sites:
                update_site_fn(sid, baseline)
        update_metrics_fn()
        self.baseline_values = {}
        self.demo_sites = []
