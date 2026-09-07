from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WeatherObservationBase(BaseModel):
    location_id: int
    rainfall_24h_mm: float
    rainfall_intensity_mmh: float
    soil_moisture_pct: float
    temperature_c: float
    humidity_pct: float
    pore_water_pressure_kpa: float
    is_simulated: bool = True
    data_source: str = "SIMULATED_INGESTION_ENGINE"

class WeatherObservationCreate(WeatherObservationBase):
    pass

class WeatherObservationResponse(WeatherObservationBase):
    id: int
    location_name: Optional[str] = None
    state: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class WeatherScenarioRequest(BaseModel):
    scenario_name: str = Field(..., description="E.g., Heavy Rainfall, Flash Surge, Drought Baseline")
    rainfall_multiplier: float = Field(1.0, ge=0.0, le=5.0)
    soil_moisture_delta: float = Field(0.0, ge=-50.0, le=50.0)
    temperature_delta: float = Field(0.0, ge=-20.0, le=20.0)

class WeatherHistoryQuery(BaseModel):
    location_id: Optional[int] = None
    limit: int = 50
