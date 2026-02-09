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

    async def _broadcast_agent_status(self):
        """Broadcast current agent statuses so frontend can shuffle cards."""
        if self.broadcast_callback:
            await self.broadcast_callback({
                'type': 'agent_update',
                'agents': self.get_all_agent_status()
            })

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

    async def run_agent_shuffle(self, site_id: str, site_name: str):
        """Visual agent shuffle cycle triggered by user actions like Start Heavy Work."""
        agents = [
            (self.perception, 'Perception', '🔵', f'Detecting noise spike at {site_name}...', 2.0),
            (self.risk, 'Risk', '🟢', f'Assessing impact risk for {site_name}...', 2.5),
            (self.control, 'Control', '🟠', f'Issuing control directives for {site_name}...', 2.0),
            (self.verification, 'Verification', '🟡', f'Verifying response at {site_name}...', 2.0),
        ]

        for agent, name, icon, action_msg, duration in agents:
            agent.set_status('processing', action_msg, 85)
            await self._broadcast_agent_status()
            self.add_to_log({
                'agent': name, 'icon': icon, 'type': 'agent_action',
                'message': action_msg, 'site_id': site_id, 'site_name': site_name
            })
            await asyncio.sleep(duration)
            agent.set_status('active', action_msg.replace('...', ' — done'), 60)

        await self._broadcast_agent_status()

    def get_recent_logs(self, count: int = 20) -> List[Dict[str, Any]]:
        return self.action_log[-count:]
