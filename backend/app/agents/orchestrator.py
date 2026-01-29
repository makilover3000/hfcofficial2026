import asyncio
from typing import Dict, Any, List, Callable
from datetime import datetime
from .perception import PerceptionAgent
from .risk import RiskAgent
from .control import ControlAgent
from .verification import VerificationAgent
from ..models.site import SiteState

class AgentOrchestrator:
    def __init__(self):
        self.perception = PerceptionAgent()
        self.risk = RiskAgent()
        self.control = ControlAgent()
        self.verification = VerificationAgent()
        self.action_log: List[Dict[str, Any]] = []
        self.broadcast_callback: Callable = None
        self.running = False

    def set_broadcast_callback(self, callback: Callable):
        self.broadcast_callback = callback

    def get_all_agent_status(self) -> List[Dict[str, Any]]:
        return [
            self.perception.get_status().model_dump(),
            self.risk.get_status().model_dump(),
            self.control.get_status().model_dump(),
            self.verification.get_status().model_dump()
        ]

    def add_to_log(self, action: Dict[str, Any]):
        action['timestamp'] = datetime.now().isoformat()
        self.action_log.append(action)
        if len(self.action_log) > 100:
            self.action_log = self.action_log[-100:]

    async def process_cycle(self, sites: Dict[str, Any], metrics: Any) -> Dict[str, Any]:
        results = {
            'perception': [],
            'risk': [],
            'control': [],
            'verification': [],
            'site_updates': {}
        }

        perception_actions = await self.perception.process(sites, metrics)
        results['perception'] = perception_actions

        for action in perception_actions:
            if action['type'] == 'state_change':
                site_id = action['site_id']
                if site_id in sites:
                    sites[site_id]['state'] = action['new_state']
                    results['site_updates'][site_id] = {'state': action['new_state']}

            self.add_to_log({
                'agent': 'Perception',
                'icon': '🔵',
                **action
            })

        risk_actions = await self.risk.process(sites, metrics)
        results['risk'] = risk_actions

        for action in risk_actions:
            self.add_to_log({
                'agent': 'Risk',
                'icon': '🟢',
                **action
            })

        control_actions = await self.control.process(sites, metrics)
        results['control'] = control_actions

        for action in control_actions:
            if action['type'] == 'control_action':
                site_id = action['site_id']
                if site_id in sites and sites[site_id].get('agent_controlled', True):
                    if site_id not in results['site_updates']:
                        results['site_updates'][site_id] = {}

                    # Apply noise reduction
                    if action['action'] == 'reduce_noise':
                        sites[site_id]['noise_level'] = action['new_value']
                        results['site_updates'][site_id]['noise_level'] = action['new_value']

                    # Apply dust reduction and suppression increase
                    if action['action'] == 'reduce_dust':
                        sites[site_id]['dust_level'] = action['new_dust']
                        sites[site_id]['dust_suppression'] = action['new_suppression']
                        results['site_updates'][site_id]['dust_level'] = action['new_dust']
                        results['site_updates'][site_id]['dust_suppression'] = action['new_suppression']

            self.add_to_log({
                'agent': 'Control',
                'icon': '🟠',
                **action
            })

        verification_actions = await self.verification.process(sites, metrics)
        results['verification'] = verification_actions

        for action in verification_actions:
            self.add_to_log({
                'agent': 'Verification',
                'icon': '🟡',
                **action
            })

        return results

    def get_recent_logs(self, count: int = 20) -> List[Dict[str, Any]]:
        return self.action_log[-count:]
