from typing import Dict, Any, List
from .base import BaseAgent
from ..models.agent import AgentType
from ..models.site import SiteState

class PerceptionAgent(BaseAgent):
    NOISE_THRESHOLD = 75.0
    DUST_THRESHOLD = 35.0

    def __init__(self):
        super().__init__(AgentType.PERCEPTION, "Perception Agent")

    async def process(self, sites: Dict[str, Any], metrics: Any) -> List[Dict[str, Any]]:
        actions = []
        alerts_found = []

        self.set_status("Monitoring", f"Scanning {len(sites)} sites", 0.3)

        for site_id, site in sites.items():
            noise = site.get('noise_level', 45)
            dust = site.get('dust_level', 15)

            old_state = site.get('state', SiteState.NORMAL)

            if noise > 85 or dust > 50:
                new_state = SiteState.HIGH_IMPACT
            elif noise > self.NOISE_THRESHOLD or dust > self.DUST_THRESHOLD:
                new_state = SiteState.ELEVATED
            else:
                new_state = SiteState.NORMAL

            if new_state != old_state:
                actions.append({
                    'type': 'state_change',
                    'site_id': site_id,
                    'old_state': old_state,
                    'new_state': new_state
                })

            if noise > self.NOISE_THRESHOLD:
                alert = f"Noise threshold exceeded at {site.get('name', site_id)}: {noise:.1f}dB"
                alerts_found.append(alert)
                actions.append({
                    'type': 'noise_alert',
                    'site_id': site_id,
                    'site_name': site.get('name', site_id),
                    'value': noise,
                    'threshold': self.NOISE_THRESHOLD
                })

            if dust > self.DUST_THRESHOLD:
                alert = f"PM2.5 threshold exceeded at {site.get('name', site_id)}: {dust:.1f} ug/m3"
                alerts_found.append(alert)
                actions.append({
                    'type': 'dust_alert',
                    'site_id': site_id,
                    'site_name': site.get('name', site_id),
                    'value': dust,
                    'threshold': self.DUST_THRESHOLD
                })

        for alert in alerts_found:
            self.add_alert(alert)

        if alerts_found:
            self.set_status("Alert", f"{len(alerts_found)} threshold breaches detected", 0.8)
        else:
            self.set_status("Monitoring", f"All {len(sites)} sites within limits", 0.2)

        return actions
