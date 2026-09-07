from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EarlyWarningCreate(BaseModel):
    location_id: int
    severity: str = Field(..., description="LOW, MODERATE, HIGH, CRITICAL")
    risk_probability: float = Field(..., ge=0.0, le=100.0)
    main_factors: str
    recommended_action: str

class EarlyWarningResponse(BaseModel):
    id: int
    location_id: int
    location_name: Optional[str] = None
    state: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    severity: str
    risk_probability: float
    main_factors: str
    recommended_action: str
    acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class WarningAcknowledgeRequest(BaseModel):
    operator_name: str = Field("NDMA_DUTY_OFFICER", description="Name/Role of operator acknowledging alert")
