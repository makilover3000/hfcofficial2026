from typing import Dict, Any, List, Set
from datetime import datetime
from ..models.metrics import DistrictMetrics, EnvironmentData
from ..models.site import SiteState
from ..agents.orchestrator import AgentOrchestrator

class AppState:
    def __init__(self):
        self.sites: Dict[str, Any] = {}
        self.environment = EnvironmentData()
        self.metrics = DistrictMetrics()
        self.orchestrator = AgentOrchestrator()
        self.connected_clients: Set = set()
        self.last_env_update = datetime.now()

    def load_sites(self, sites: Dict[str, Any]):
        self.sites = sites
        self.update_metrics()

    def get_site(self, site_id: str) -> Dict[str, Any]:
        return self.sites.get(site_id)

    def update_site(self, site_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        if site_id not in self.sites:
            return None

        site = self.sites[site_id]

        if 'noise_level' in updates:
            site['noise_level'] = max(0, min(100, updates['noise_level']))
        if 'dust_level' in updates:
            site['dust_level'] = max(0, min(100, updates['dust_level']))
        if 'dust_suppression' in updates:
            site['dust_suppression'] = max(0, min(100, updates['dust_suppression']))
        if 'agent_controlled' in updates:
            site['agent_controlled'] = updates['agent_controlled']

        noise = site['noise_level']
        dust = site['dust_level']

        if noise > 85 or dust > 50:
            site['state'] = 'high_impact'
        elif noise > 75 or dust > 35:
            site['state'] = 'elevated'
        else:
            site['state'] = 'normal'

        self.update_metrics()
        return site

    def update_metrics(self):
        max_noise = 0
        max_noise_site = None
        total_construction_dust = 0
        elevated = 0
        high_impact = 0

        for site_id, site in self.sites.items():
            noise = site.get('noise_level', 45)
            dust = site.get('dust_level', 15)
            state = site.get('state', 'normal')

            if noise > max_noise:
                max_noise = noise
                max_noise_site = site.get('name', site_id)

            suppression = site.get('dust_suppression', 50) / 100
            effective_dust = dust * (1 - suppression * 0.5)
            total_construction_dust += effective_dust

            if state == 'elevated':
                elevated += 1
            elif state == 'high_impact':
                high_impact += 1

        avg_construction_dust = total_construction_dust / max(1, len(self.sites))

        self.metrics.max_noise = max_noise
        self.metrics.max_noise_site = max_noise_site
        self.metrics.baseline_pm25 = self.environment.pm25
        self.metrics.construction_pm25 = avg_construction_dust
        self.metrics.total_pm25 = self.environment.pm25 + avg_construction_dust
        self.metrics.elevated_sites = elevated
        self.metrics.high_impact_sites = high_impact
        self.metrics.affected_residents = (elevated + high_impact) * 3 * 400
        self.metrics.risk_score = min(10, (elevated * 0.5 + high_impact * 1.5))
        self.metrics.environment = self.environment

    def update_environment(self, env_data: EnvironmentData):
        self.environment = env_data
        self.metrics.environment = env_data
        self.last_env_update = datetime.now()
        self.update_metrics()

    def get_all_sites_for_map(self) -> Dict[str, Any]:
        return {
            'type': 'FeatureCollection',
            'features': [
                {
                    'type': 'Feature',
                    'id': site_id,
                    'properties': {
                        'id': site_id,
                        'name': site.get('name', ''),
                        'state': site.get('state', 'normal'),
                        'noise_level': site.get('noise_level', 45),
                        'dust_level': site.get('dust_level', 15),
                        'dust_suppression': site.get('dust_suppression', 50),
                        'contractor': site.get('contractor', ''),
                        'status': site.get('status', ''),
                        'agent_controlled': site.get('agent_controlled', True)
                    },
                    'geometry': site.get('geometry', {})
                }
                for site_id, site in self.sites.items()
            ]
        }
