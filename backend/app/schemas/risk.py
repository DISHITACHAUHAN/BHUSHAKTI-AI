from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.app.schemas.weather import WeatherObservationResponse

class RiskZoneBase(BaseModel):
    name: str
    state: str
    latitude: float
    longitude: float
    elevation_m: float
    slope_deg: float
    soil_type: str
    historical_events_count: int
    population_exposed: int
    baseline_risk_score: float

class RiskZoneCreate(RiskZoneBase):
    pass

class RiskZoneResponse(RiskZoneBase):
    id: int
    current_risk_score: Optional[float] = None
    current_risk_category: Optional[str] = "LOW"
    latest_weather: Optional[WeatherObservationResponse] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RiskOverviewSchema(BaseModel):
    total_monitored_locations: int
    low_count: int
    moderate_count: int
    high_count: int
    critical_count: int
    active_warnings_count: int
    exposed_population_total: int
    high_risk_hotspots: List[Dict[str, Any]]
    recent_trend: List[Dict[str, Any]]
