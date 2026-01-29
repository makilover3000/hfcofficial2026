from typing import Dict, Any, List
from .base import BaseAgent
from ..models.agent import AgentType
from ..models.site import SiteState

class ControlAgent(BaseAgent):
    def __init__(self):
        super().__init__(AgentType.CONTROL, "Control & Policy Agent")
        self.pending_actions = []

    async def process(self, sites: Dict[str, Any], metrics: Any) -> List[Dict[str, Any]]:
        actions = []

        self.set_status("Analyzing", "Evaluating coordination options", 0.4)

        problem_sites = []
        for site_id, site in sites.items():
            state = site.get('state', SiteState.NORMAL)
            if state in [SiteState.ELEVATED, SiteState.HIGH_IMPACT, 'elevated', 'high_impact']:
                problem_sites.append({
                    'id': site_id,
                    'name': site.get('name', site_id),
                    'noise': site.get('noise_level', 45),
                    'dust': site.get('dust_level', 15),
                    'dust_suppression': site.get('dust_suppression', 50),
                    'state': state,
                    'agent_controlled': site.get('agent_controlled', True)
                })

        if not problem_sites:
            self.set_status("Monitoring", "No intervention needed", 0.2)
            return actions

        self.set_status("Executing", f"Coordinating {len(problem_sites)} sites", 0.8)

        for site in problem_sites:
            if not site['agent_controlled']:
                actions.append({
                    'type': 'info',
                    'action': 'manual_control',
                    'site_id': site['id'],
                    'site_name': site['name'],
                    'message': f"Site {site['name']} is under manual control - agent cannot intervene"
                })
                continue

            # Reduce noise if above threshold
            if site['noise'] > 75:
                noise_reduction = min(20, site['noise'] - 70)  # Reduce towards safe levels
                new_noise = max(45, site['noise'] - noise_reduction)
                actions.append({
                    'type': 'control_action',
                    'action': 'reduce_noise',
                    'site_id': site['id'],
                    'site_name': site['name'],
                    'old_value': site['noise'],
                    'new_value': new_noise,
                    'reason': f"Noise at {site['noise']:.0f}dB exceeds 75dB threshold - reducing equipment activity"
                })
                self.add_alert(f"Reducing noise at {site['name']} from {site['noise']:.0f}dB to {new_noise:.0f}dB")

            # Reduce dust and increase suppression if above threshold
            if site['dust'] > 35:
                new_suppression = min(100, site['dust_suppression'] + 30)
                dust_reduction = min(15, site['dust'] - 30)
                new_dust = max(15, site['dust'] - dust_reduction)
                actions.append({
                    'type': 'control_action',
                    'action': 'reduce_dust',
                    'site_id': site['id'],
                    'site_name': site['name'],
                    'old_dust': site['dust'],
                    'new_dust': new_dust,
                    'old_suppression': site['dust_suppression'],
                    'new_suppression': new_suppression,
                    'reason': f"PM2.5 at {site['dust']:.0f} exceeds threshold - activating water sprayers"
                })
                self.add_alert(f"Activating dust control at {site['name']}")

            if site['state'] in [SiteState.HIGH_IMPACT, 'high_impact']:
                actions.append({
                    'type': 'notification',
                    'action': 'notify_residents',
                    'site_id': site['id'],
                    'site_name': site['name'],
                    'message': f"High construction activity at {site['name']}. AI agents are reducing impact."
                })
                self.add_alert(f"Notifying residents near {site['name']}")

        high_impact = [s for s in problem_sites if s['state'] in [SiteState.HIGH_IMPACT, 'high_impact']]
        if len(high_impact) >= 2:
            actions.append({
                'type': 'coordination',
                'action': 'stagger_work',
                'sites': [s['id'] for s in high_impact],
                'site_names': [s['name'] for s in high_impact],
                'reason': f"{len(high_impact)} nearby sites with high impact - requesting staggered work schedules"
            })
            self.add_alert(f"Requesting work staggering for {len(high_impact)} high-impact sites")

        return actions
