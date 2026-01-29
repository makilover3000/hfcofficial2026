from pydantic import BaseModel
from typing import Optional, List, Any
from enum import Enum

class SiteState(str, Enum):
    NORMAL = "normal"
    ELEVATED = "elevated"
    HIGH_IMPACT = "high_impact"

class Site(BaseModel):
    id: str
    name: str
    status: str
    contractor: Optional[str] = None
    start_date: Optional[str] = None
    completion_date: Optional[str] = None
    geometry: Any
    centroid: List[float]
    noise_level: float = 45.0
    dust_level: float = 15.0
    dust_suppression: float = 50.0
    state: SiteState = SiteState.NORMAL
    is_selected: bool = False
    agent_controlled: bool = True

class SiteControl(BaseModel):
    noise_level: Optional[float] = None
    dust_level: Optional[float] = None
    dust_suppression: Optional[float] = None
    agent_controlled: Optional[bool] = None
