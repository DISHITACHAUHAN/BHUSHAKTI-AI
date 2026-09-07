from pydantic import BaseModel, Field
from typing import Optional, List

class InfrastructureItemBase(BaseModel):
    name: str
    type: str  # highway_corridor, bridge, hospital, school, shelter, power_substation
    latitude: float
    longitude: float
    location_id: Optional[int] = None
    capacity: int = 500
    criticality: str = "HIGH"
    status: str = "OPERATIONAL"

class InfrastructureItemCreate(InfrastructureItemBase):
    pass

class InfrastructureItemResponse(InfrastructureItemBase):
    id: int
    distance_km: Optional[float] = None
    risk_level: Optional[str] = "LOW"

    class Config:
        from_attributes = True

class NearbyInfraQuery(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = Field(25.0, ge=1.0, le=200.0)
    infra_type: Optional[str] = None
