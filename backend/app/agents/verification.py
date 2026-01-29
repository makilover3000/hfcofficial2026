from typing import Dict, Any, List
from datetime import datetime
from .base import BaseAgent
from ..models.agent import AgentType
from ..models.site import SiteState

class VerificationAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentType.VERIFICATION, "Verification & Learning Agent")
        self.intervention_history = {}
        self.effectiveness_scores = {}

    async def process(self, sites: Dict[str, Any], metrics: Any) -> List[Dict[str, Any]]:
        actions = []

        self.set_status("Verifying", "Measuring intervention effectiveness", 0.4)

        for site_id, site in sites.items():
            if site_id in self.intervention_history:
                old_data = self.intervention_history[site_id]
                old_noise = old_data.get('noise', 45)
                old_dust = old_data.get('dust', 15)
                old_state = old_data.get('state', SiteState.NORMAL)

                current_noise = site.get('noise_level', 45)
                current_dust = site.get('dust_level', 15)
                current_state = site.get('state', SiteState.NORMAL)

                noise_improved = current_noise < old_noise
                dust_improved = current_dust < old_dust
                state_improved = (
                    (old_state in [SiteState.HIGH_IMPACT, 'high_impact'] and
                     current_state in [SiteState.ELEVATED, SiteState.NORMAL, 'elevated', 'normal']) or
                    (old_state in [SiteState.ELEVATED, 'elevated'] and
                     current_state in [SiteState.NORMAL, 'normal'])
                )

                if noise_improved or dust_improved or state_improved:
                    actions.append({
                        'type': 'verification_result',
                        'site_id': site_id,
                        'site_name': site.get('name', site_id),
                        'noise_change': old_noise - current_noise,
                        'dust_change': old_dust - current_dust,
                        'state_improved': state_improved,
                        'success': True
                    })
                    self.add_alert(f"Intervention effective at {site.get('name', site_id)}: noise {old_noise:.0f}dB -> {current_noise:.0f}dB")

                    if site_id not in self.effectiveness_scores:
                        self.effectiveness_scores[site_id] = []
                    self.effectiveness_scores[site_id].append({
                        'timestamp': datetime.now(),
                        'success': True,
                        'noise_reduction': old_noise - current_noise,
                        'dust_reduction': old_dust - current_dust
                    })

        for site_id, site in sites.items():
            state = site.get('state', SiteState.NORMAL)
            if state in [SiteState.ELEVATED, SiteState.HIGH_IMPACT, 'elevated', 'high_impact']:
                self.intervention_history[site_id] = {
                    'noise': site.get('noise_level', 45),
                    'dust': site.get('dust_level', 15),
                    'state': state,
                    'timestamp': datetime.now()
                }

        verified_count = len([a for a in actions if a.get('success')])
        if verified_count > 0:
            self.set_status("Verified", f"{verified_count} successful interventions", 0.7)
        else:
            self.set_status("Monitoring", "Tracking intervention outcomes", 0.3)

        return actions
