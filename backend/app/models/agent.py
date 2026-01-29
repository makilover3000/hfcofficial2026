from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime

class AgentType(str, Enum):
    PERCEPTION = "perception"
    RISK = "risk"
    CONTROL = "control"
    VERIFICATION = "verification"

class AgentStatus(BaseModel):
    agent_type: AgentType
    name: str
    status: str
    activity: float = 0.0
    current_action: Optional[str] = None
    last_update: datetime = datetime.now()
    alerts: List[str] = []
