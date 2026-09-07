from backend.app.routes.risk import router as risk_router
from backend.app.routes.weather import router as weather_router
from backend.app.routes.warnings import router as warnings_router
from backend.app.routes.infrastructure import router as infrastructure_router
from backend.app.routes.field_reports import router as field_reports_router
from backend.app.routes.prediction import router as prediction_router
from backend.app.routes.copilot import router as copilot_router

__all__ = [
    "risk_router",
    "weather_router",
    "warnings_router",
    "infrastructure_router",
    "field_reports_router",
    "prediction_router",
    "copilot_router"
]
