from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FieldReportCreate(BaseModel):
    location_name: str = Field(..., description="Name of village, highway, or landmark")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    hazard_type: str = Field(..., description="landslide, slope_crack, rockfall, road_blockage, water_seepage")
    severity: str = Field("MODERATE", description="LOW, MODERATE, HIGH, CRITICAL")
    description: str = Field(..., min_length=5, description="Detailed ground observation report")
    image_url: Optional[str] = None
    reporter_role: str = Field("FIELD_RANGER", description="CITIZEN, FIELD_RANGER, NDMA_OFFICER")

class FieldReportResponse(BaseModel):
    id: int
    location_name: str
    latitude: float
    longitude: float
    hazard_type: str
    severity: str
    description: str
    image_url: Optional[str] = None
    reporter_role: str
    verification_status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FieldReportStatusUpdate(BaseModel):
    verification_status: str = Field(..., description="UNDER_REVIEW, VERIFIED, DISMISSED")
