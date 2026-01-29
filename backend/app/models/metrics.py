from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EnvironmentData(BaseModel):
    pm25: float = 15.0
    temperature: float = 30.0
    humidity: float = 75.0
    wind_speed: float = 3.0
    wind_direction: str = "SE"
    rainfall: float = 0.0
    last_update: datetime = datetime.now()

class DistrictMetrics(BaseModel):
    max_noise: float = 45.0
    max_noise_site: Optional[str] = None
    total_pm25: float = 15.0
    baseline_pm25: float = 15.0
    construction_pm25: float = 0.0
    elevated_sites: int = 0
    high_impact_sites: int = 0
    affected_residents: int = 0
    risk_score: float = 0.0
    environment: EnvironmentData = EnvironmentData()
