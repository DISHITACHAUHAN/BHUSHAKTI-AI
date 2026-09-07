from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from backend.app.database.session import get_db
from backend.app.models.weather import WeatherObservation
from backend.app.models.location import Location
from backend.app.schemas.weather import WeatherObservationResponse
from backend.app.services.weather_simulator import weather_simulator

router = APIRouter(prefix="/api/weather", tags=["Weather Ingestion & Simulation"])

class SimulatorScenarioUpdate(BaseModel):
    scenario: str = Field(..., description="DYNAMIC_CYCLE, MONSOON_SURGE, FLASH_CLOUDBURST, DRY_STABILIZATION")

@router.get("/latest", response_model=List[WeatherObservationResponse])
def get_latest_weather(db: Session = Depends(get_db)):
    """
    Returns latest telemetry across all locations.
    All data from this service is explicitly labelled with is_simulated=True.
    """
    locations = db.query(Location).all()
    results = []

    for loc in locations:
        latest = (
            db.query(WeatherObservation)
            .filter(WeatherObservation.location_id == loc.id)
            .order_by(WeatherObservation.timestamp.desc())
            .first()
        )
        if latest:
            results.append(
                WeatherObservationResponse(
                    id=latest.id,
                    location_id=latest.location_id,
                    location_name=loc.name,
                    state=loc.state,
                    rainfall_24h_mm=latest.rainfall_24h_mm,
                    rainfall_intensity_mmh=latest.rainfall_intensity_mmh,
                    soil_moisture_pct=latest.soil_moisture_pct,
                    temperature_c=latest.temperature_c,
                    humidity_pct=latest.humidity_pct,
                    pore_water_pressure_kpa=latest.pore_water_pressure_kpa,
                    is_simulated=latest.is_simulated,
                    data_source=latest.data_source,
                    timestamp=latest.timestamp
                )
            )

    return results

@router.get("/simulator/status")
def get_simulator_status():
    """
    Returns the real-time operational status of the background weather simulation engine.
    """
    return {
        "is_running": weather_simulator.is_running,
        "current_scenario": weather_simulator.current_scenario,
        "tick_count": weather_simulator.tick_count,
        "interval_seconds": weather_simulator.interval_seconds,
        "last_updated_at": weather_simulator.last_updated_at,
        "data_notice": "SIMULATED_DEMO_STREAM — Real-time values are passed directly into XGBoost ML pipeline."
    }

@router.post("/simulator/scenario")
def set_simulator_scenario(payload: SimulatorScenarioUpdate):
    """
    Switches active weather simulation scenario (e.g. MONSOON_SURGE, FLASH_CLOUDBURST, DRY_STABILIZATION, DYNAMIC_CYCLE).
    """
    success = weather_simulator.set_scenario(payload.scenario)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid scenario name")
    
    # Run immediate step on scenario switch
    step_results = weather_simulator.step_simulation(payload.scenario)
    return {
        "status": "SCENARIO_UPDATED",
        "scenario": payload.scenario,
        "evaluated_districts": step_results
    }

@router.post("/simulator/trigger-tick")
def trigger_simulator_tick():
    """
    Manually triggers one weather evolution step and immediately recalculates all district XGBoost risks.
    """
    results = weather_simulator.step_simulation()
    return {
        "status": "TICK_COMPLETED",
        "tick_count": weather_simulator.tick_count,
        "evaluated_districts": results
    }

@router.get("/history", response_model=List[WeatherObservationResponse])
def get_weather_history(
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(WeatherObservation)
    if location_id:
        query = query.filter(WeatherObservation.location_id == location_id)

    records = query.order_by(WeatherObservation.timestamp.desc()).limit(limit).all()
    loc_map = {loc.id: (loc.name, loc.state) for loc in db.query(Location).all()}

    results = []
    for r in records:
        name, state = loc_map.get(r.location_id, ("Unknown", "Unknown"))
        results.append(
            WeatherObservationResponse(
                id=r.id,
                location_id=r.location_id,
                location_name=name,
                state=state,
                rainfall_24h_mm=r.rainfall_24h_mm,
                rainfall_intensity_mmh=r.rainfall_intensity_mmh,
                soil_moisture_pct=r.soil_moisture_pct,
                temperature_c=r.temperature_c,
                humidity_pct=r.humidity_pct,
                pore_water_pressure_kpa=r.pore_water_pressure_kpa,
                is_simulated=r.is_simulated,
                data_source=r.data_source,
                timestamp=r.timestamp
            )
        )
    return results
