from typing import Dict, Any, List
from datetime import datetime
import math
from .base import BaseAgent
from ..models.agent import AgentType
from ..models.site import SiteState

class RiskAgent(BaseAgent):
    RESIDENTS_PER_BLOCK = 400
    RISK_RADIUS_METERS = 500

    def __init__(self):
        super().__init__(AgentType.RISK, "Risk & Impact Agent")

    def _get_time_weight(self) -> float:
        hour = datetime.now().hour
        if 7 <= hour <= 9:
            return 1.5
        elif 12 <= hour <= 14:
            return 1.3
        elif 18 <= hour <= 22:
            return 1.8
        elif 22 <= hour or hour < 7:
            return 2.0
        return 1.0

    def _calculate_risk_score(self, noise: float, dust: float, duration_factor: float = 1.0) -> float:
        noise_risk = max(0, (noise - 60) / 35) * 5
        dust_risk = max(0, (dust - 20) / 30) * 5
        time_weight = self._get_time_weight()
        return min(10, (noise_risk + dust_risk) * time_weight * duration_factor)

    def _estimate_affected_residents(self, sites: Dict[str, Any]) -> int:
        affected_sites = [s for s in sites.values()
                        if s.get('state') in [SiteState.ELEVATED, SiteState.HIGH_IMPACT, 'elevated', 'high_impact']]
        blocks_affected = len(affected_sites) * 3
        return blocks_affected * self.RESIDENTS_PER_BLOCK

    def _find_nearby_sites(self, site: Dict, all_sites: Dict[str, Any], radius_km: float = 0.5) -> List[str]:
        nearby = []
        site_centroid = site.get('centroid', [0, 0])

        for other_id, other_site in all_sites.items():
            if other_id == site.get('id'):
                continue
            other_centroid = other_site.get('centroid', [0, 0])

            lat_diff = abs(site_centroid[1] - other_centroid[1]) * 111
            lon_diff = abs(site_centroid[0] - other_centroid[0]) * 111 * math.cos(math.radians(site_centroid[1]))
            distance = math.sqrt(lat_diff**2 + lon_diff**2)

            if distance < radius_km:
                nearby.append(other_id)

        return nearby

    async def process(self, sites: Dict[str, Any], metrics: Any) -> List[Dict[str, Any]]:
        actions = []

        self.set_status("Computing", "Calculating district exposure", 0.5)

        elevated_sites = []
        high_impact_sites = []
        max_risk = 0.0

        for site_id, site in sites.items():
            noise = site.get('noise_level', 45)
            dust = site.get('dust_level', 15)
            state = site.get('state', SiteState.NORMAL)

            if state in [SiteState.ELEVATED, 'elevated']:
                elevated_sites.append(site_id)
            elif state in [SiteState.HIGH_IMPACT, 'high_impact']:
                high_impact_sites.append(site_id)

            risk = self._calculate_risk_score(noise, dust)
            max_risk = max(max_risk, risk)

            nearby = self._find_nearby_sites(site, sites)
            nearby_elevated = [n for n in nearby
                            if sites[n].get('state') in [SiteState.ELEVATED, SiteState.HIGH_IMPACT, 'elevated', 'high_impact']]

            if nearby_elevated and state in [SiteState.ELEVATED, SiteState.HIGH_IMPACT, 'elevated', 'high_impact']:
                cumulative_risk = risk * (1 + 0.3 * len(nearby_elevated))
                actions.append({
                    'type': 'cumulative_risk',
                    'site_id': site_id,
                    'site_name': site.get('name', site_id),
                    'nearby_sites': nearby_elevated,
                    'risk_score': min(10, cumulative_risk)
                })

        affected_residents = self._estimate_affected_residents(sites)

        actions.append({
            'type': 'district_assessment',
            'elevated_count': len(elevated_sites),
            'high_impact_count': len(high_impact_sites),
            'affected_residents': affected_residents,
            'max_risk_score': max_risk,
            'time_weight': self._get_time_weight()
        })

        if affected_residents > 0:
            alert = f"{len(elevated_sites) + len(high_impact_sites)} sites elevated, {affected_residents:,} residents affected"
            self.add_alert(alert)
            self.set_status("Alert", alert, 0.9)
        else:
            self.set_status("Normal", "No elevated risk detected", 0.2)

        return actions
