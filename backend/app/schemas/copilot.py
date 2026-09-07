from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class CopilotQueryRequest(BaseModel):
    query: str = Field(..., description="User operational query to the copilot")
    location_id: Optional[int] = Field(None, description="Optional focused location ID")
    context_data: Optional[Dict[str, Any]] = Field(None, description="Optional real-time system context passed from UI")

class CopilotQueryResponse(BaseModel):
    query: str
    response: str
    engine: str = "Google Gemini 1.5 Flash (Grounded)"
    is_fallback: bool = False
    structured_context_used: Dict[str, Any]
    disclaimer: str = "BhuShakti AI provides decision-support analysis based strictly on available telemetry and model outputs. It does not replace official NDRF/SDMA command directives."

class QuickPromptItem(BaseModel):
    id: str
    category: str
    title: str
    query: str
    location_id: Optional[int] = None
