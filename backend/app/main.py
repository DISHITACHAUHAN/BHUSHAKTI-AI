from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.database.session import init_db
from backend.app.utils.seeder import seed_database
from backend.app.services.weather_simulator import weather_simulator
from backend.app.routes import (
    risk_router,
    weather_router,
    warnings_router,
    infrastructure_router,
    field_reports_router,
    prediction_router,
    copilot_router
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database schema, seed baseline data
    print(f"[{settings.APP_NAME}] Initializing database schema...")
    init_db()
    seed_database()

    # Launch background weather simulator if enabled
    if settings.SIMULATION_MODE:
        await weather_simulator.start()

    print(f"[{settings.APP_NAME}] Backend initialized successfully.")
    yield
    # Shutdown logic
    print(f"[{settings.APP_NAME}] Shutting down...")
    await weather_simulator.stop()

app = FastAPI(
    title="BHUSHAKTI AI API",
    description="AI-Based Early Warning & Landslide Risk Monitoring Decision-Support System for Northeast India (SIH 2026 Prototype)",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check Endpoints
@app.get("/api/health", tags=["System Health"])
@app.get("/health", tags=["System Health"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "BHUSHAKTI AI Backend",
        "version": "1.0.0",
        "database": "CONNECTED",
        "simulation_mode": settings.SIMULATION_MODE,
        "simulator_running": weather_simulator.is_running,
        "simulator_scenario": weather_simulator.current_scenario,
        "data_notice": "ENVIRONMENTAL_TELEMETRY_IS_SIMULATED_DEMO_STREAM"
    }

# Mount Routers
app.include_router(risk_router)
app.include_router(weather_router)
app.include_router(warnings_router)
app.include_router(infrastructure_router)
app.include_router(field_reports_router)
app.include_router(prediction_router)
app.include_router(copilot_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
