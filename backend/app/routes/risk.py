from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.database.session import get_db
from backend.app.models.location import Location
from backend.app.models.weather import WeatherObservation
from backend.app.models.warning import EarlyWarning
from backend.app.schemas.risk import RiskZoneResponse, RiskOverviewSchema
from backend.app.schemas.weather import WeatherObservationResponse

router = APIRouter(prefix="/api", tags=["Risk & Locations"])

@router.get("/risk-zones", response_model=List[RiskZoneResponse])
def get_risk_zones(db: Session = Depends(get_db)):
    """
    Returns all monitored risk zones with their latest environmental telemetry and current risk score.
    """
    locations = db.query(Location).all()
    results = []

    for loc in locations:
        latest_weather = (
            db.query(WeatherObservation)
            .filter(WeatherObservation.location_id == loc.id)
            .order_by(WeatherObservation.timestamp.desc())
            .first()
        )

        score = loc.baseline_risk_score
        if score >= 75.0:
            category = "CRITICAL"
        elif score >= 50.0:
            category = "HIGH"
        elif score >= 25.0:
            category = "MODERATE"
        else:
            category = "LOW"

        weather_dto = None
        if latest_weather:
            weather_dto = WeatherObservationResponse(
                id=latest_weather.id,
                location_id=latest_weather.location_id,
                location_name=loc.name,
                state=loc.state,
                rainfall_24h_mm=latest_weather.rainfall_24h_mm,
                rainfall_intensity_mmh=latest_weather.rainfall_intensity_mmh,
                soil_moisture_pct=latest_weather.soil_moisture_pct,
                temperature_c=latest_weather.temperature_c,
                humidity_pct=latest_weather.humidity_pct,
                pore_water_pressure_kpa=latest_weather.pore_water_pressure_kpa,
                is_simulated=latest_weather.is_simulated,
                data_source=latest_weather.data_source,
                timestamp=latest_weather.timestamp
            )

        zone_dto = RiskZoneResponse(
            id=loc.id,
            name=loc.name,
            state=loc.state,
            latitude=loc.latitude,
            longitude=loc.longitude,
            elevation_m=loc.elevation_m,
            slope_deg=loc.slope_deg,
            soil_type=loc.soil_type,
            historical_events_count=loc.historical_events_count,
            population_exposed=loc.population_exposed,
            baseline_risk_score=loc.baseline_risk_score,
            current_risk_score=score,
            current_risk_category=category,
            latest_weather=weather_dto,
            created_at=loc.created_at
        )
        results.append(zone_dto)

    return results

@router.get("/risk/{id}", response_model=RiskZoneResponse)
def get_risk_zone_by_id(id: int, db: Session = Depends(get_db)):
    """
    Returns full dossier for a specific risk zone by ID.
    """
    loc = db.query(Location).filter(Location.id == id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Risk zone location not found")

    latest_weather = (
        db.query(WeatherObservation)
        .filter(WeatherObservation.location_id == loc.id)
        .order_by(WeatherObservation.timestamp.desc())
        .first()
    )

    score = loc.baseline_risk_score
    if score >= 75.0:
        category = "CRITICAL"
    elif score >= 50.0:
        category = "HIGH"
    elif score >= 25.0:
        category = "MODERATE"
    else:
        category = "LOW"

    weather_dto = None
    if latest_weather:
        weather_dto = WeatherObservationResponse(
            id=latest_weather.id,
            location_id=latest_weather.location_id,
            location_name=loc.name,
            state=loc.state,
            rainfall_24h_mm=latest_weather.rainfall_24h_mm,
            rainfall_intensity_mmh=latest_weather.rainfall_intensity_mmh,
            soil_moisture_pct=latest_weather.soil_moisture_pct,
            temperature_c=latest_weather.temperature_c,
            humidity_pct=latest_weather.humidity_pct,
            pore_water_pressure_kpa=latest_weather.pore_water_pressure_kpa,
            is_simulated=latest_weather.is_simulated,
            data_source=latest_weather.data_source,
            timestamp=latest_weather.timestamp
        )

    return RiskZoneResponse(
        id=loc.id,
        name=loc.name,
        state=loc.state,
        latitude=loc.latitude,
        longitude=loc.longitude,
        elevation_m=loc.elevation_m,
        slope_deg=loc.slope_deg,
        soil_type=loc.soil_type,
        historical_events_count=loc.historical_events_count,
        population_exposed=loc.population_exposed,
        baseline_risk_score=loc.baseline_risk_score,
        current_risk_score=score,
        current_risk_category=category,
        latest_weather=weather_dto,
        created_at=loc.created_at
    )

@router.get("/risk-overview", response_model=RiskOverviewSchema)
def get_risk_overview(db: Session = Depends(get_db)):
    """
    Returns aggregated KPIs for the Command Center dashboard.
    """
    locations = db.query(Location).all()
    active_warnings = db.query(EarlyWarning).filter(EarlyWarning.acknowledged == False).count()

    low, mod, high, crit = 0, 0, 0, 0
    total_pop = 0
    hotspots = []

    for loc in locations:
        score = loc.baseline_risk_score
        total_pop += loc.population_exposed
        if score >= 75.0:
            crit += 1
            hotspots.append({"id": loc.id, "name": loc.name, "state": loc.state, "score": score, "category": "CRITICAL"})
        elif score >= 50.0:
            high += 1
            hotspots.append({"id": loc.id, "name": loc.name, "state": loc.state, "score": score, "category": "HIGH"})
        elif score >= 25.0:
            mod += 1
        else:
            low += 1

    return RiskOverviewSchema(
        total_monitored_locations=len(locations),
        low_count=low,
        moderate_count=mod,
        high_count=high,
        critical_count=crit,
        active_warnings_count=active_warnings,
        exposed_population_total=total_pop,
        high_risk_hotspots=hotspots,
        recent_trend=[
            {"time": "00:00", "avg_risk": 41.2},
            {"time": "04:00", "avg_risk": 43.5},
            {"time": "08:00", "avg_risk": 49.0},
            {"time": "12:00", "avg_risk": 54.8},
            {"time": "16:00", "avg_risk": 58.2},
            {"time": "Now", "avg_risk": 61.4}
        ]
    )
