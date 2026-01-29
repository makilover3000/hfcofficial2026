from abc import ABC, abstractmethod
from typing import Dict, Any, List
from datetime import datetime
from ..models.agent import AgentStatus, AgentType

class BaseAgent(ABC):
    def __init__(self, agent_type: AgentType, name: str):
        self.agent_type = agent_type
        self.name = name
        self.status = "Idle"
        self.activity = 0.0
        self.current_action = None
        self.alerts: List[str] = []
        self.last_update = datetime.now()

    def get_status(self) -> AgentStatus:
        return AgentStatus(
            agent_type=self.agent_type,
            name=self.name,
            status=self.status,
            activity=self.activity,
            current_action=self.current_action,
            last_update=self.last_update,
            alerts=self.alerts[-5:]
        )

    def set_status(self, status: str, action: str = None, activity: float = None):
        self.status = status
        if action:
            self.current_action = action
        if activity is not None:
            self.activity = activity
        self.last_update = datetime.now()

    def add_alert(self, alert: str):
        self.alerts.append(alert)
        if len(self.alerts) > 20:
            self.alerts = self.alerts[-20:]

    @abstractmethod
    async def process(self, sites: Dict[str, Any], metrics: Any) -> List[Dict[str, Any]]:
        pass
