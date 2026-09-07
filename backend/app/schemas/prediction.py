from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

class PredictRequest(BaseModel):
    location_id: Optional[int] = Field(None, description="Optional location ID")
    rainfall_24h: float = Field(..., ge=0, le=1000, description="24-hour accumulated rainfall in mm")
    soil_moisture: float = Field(..., ge=0, le=100, description="Volumetric soil moisture percentage (0-100%)")
    slope: float = Field(..., ge=0, le=90, description="Slope gradient in degrees (0-90°)")
    elevation: float = Field(..., ge=0, le=9000, description="Elevation above sea level in meters")
    historical_events: int = Field(..., ge=0, description="Number of historical recorded landslide events in area")
    temperature: float = Field(..., ge=-30, le=60, description="Ambient temperature in °C")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity in percentage (0-100%)")

class ContributingFactor(BaseModel):
    feature: str
    feature_key: Optional[str] = None
    value: float
    shap_value: float = Field(..., description="Raw marginal log-odds SHAP value calculated by TreeExplainer")
    contribution: float = Field(..., description="Normalized contribution percentage (|shap_i| / sum(|shap_j|) * 100)")
    impact: str = Field(..., description="High, Moderate, Low based on SHAP magnitude")
    direction: str = Field(..., description="Increases Risk, Decreases Risk, Neutral")

class PredictResponse(BaseModel):
    risk_probability: float = Field(..., description="Landslide probability (0.0 to 1.0 or 0 to 100%)")
    risk_percentage: float = Field(..., description="Risk score percentage (0-100)")
    risk_category: str = Field(..., description="Risk category: LOW, MODERATE, HIGH, CRITICAL")
    contributing_factors: List[ContributingFactor]
    shap_base_value: Optional[float] = Field(None, description="Expected value / base log-odds of the model")
    model_version: str = "xgboost_v1.0"
    explanation_summary: str
    recommended_action: str
    timestamp: datetime
