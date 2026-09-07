from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from backend.app.database.session import get_db
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.location import Location
from backend.app.schemas.infrastructure import InfrastructureItemResponse
from backend.app.utils.geo import haversine_distance_km

router = APIRouter(prefix="/api/infrastructure", tags=["Infrastructure Monitoring"])

@router.get("", response_model=List[InfrastructureItemResponse])
def get_all_infrastructure(
    infra_type: Optional[str] = Query(None, description="Filter by type (highway_corridor, bridge, hospital, school, village, shelter)"),
    db: Session = Depends(get_db)
):
    """
    Returns all registered critical infrastructure elements across Northeast India.
    """
    query = db.query(Infrastructure)
    if infra_type:
        query = query.filter(Infrastructure.type == infra_type)
    items = query.all()

    return [
        InfrastructureItemResponse(
            id=item.id,
            name=item.name,
            type=item.type,
            latitude=item.latitude,
            longitude=item.longitude,
            location_id=item.location_id,
            capacity=item.capacity,
            criticality=item.criticality,
            status=item.status,
            distance_km=None,
            risk_level="LOW"
        )
        for item in items
    ]

@router.get("/nearby", response_model=List[InfrastructureItemResponse])
def get_nearby_infrastructure(
    latitude: float = Query(..., ge=-90.0, le=90.0),
    longitude: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(35.0, ge=1.0, le=200.0),
    infra_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Finds nearby infrastructure within a given radius using Haversine geospatial distance calculation.
    """
    query = db.query(Infrastructure)
    if infra_type:
        query = query.filter(Infrastructure.type == infra_type)
    all_infra = query.all()

    nearby = []
    for item in all_infra:
        dist = haversine_distance_km(latitude, longitude, item.latitude, item.longitude)
        if dist <= radius_km:
            if dist <= 5.0:
                risk = "CRITICAL"
            elif dist <= 15.0:
                risk = "HIGH"
            elif dist <= 30.0:
                risk = "MODERATE"
            else:
                risk = "MONITORED"

            nearby.append(
                InfrastructureItemResponse(
                    id=item.id,
                    name=item.name,
                    type=item.type,
                    latitude=item.latitude,
                    longitude=item.longitude,
                    location_id=item.location_id,
                    capacity=item.capacity,
                    criticality=item.criticality,
                    status=item.status,
                    distance_km=dist,
                    risk_level=risk
                )
            )

    nearby.sort(key=lambda x: x.distance_km or 9999)
    return nearby

@router.get("/hotspot/{location_id}/impact")
def get_hotspot_infrastructure_impact(
    location_id: int,
    radius_km: float = Query(40.0, ge=5.0, le=150.0),
    db: Session = Depends(get_db)
):
    """
    Performs comprehensive geospatial impact assessment for a selected hazard hotspot district.
    Returns categorized roads, bridges, hospitals, schools, vulnerable habitations, and closest emergency shelters.
    """
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Hotspot location not found")

    all_infra = db.query(Infrastructure).all()
    corridors = []
    bridges = []
    hospitals = []
    schools = []
    villages = []
    shelters = []

    for item in all_infra:
        dist = haversine_distance_km(loc.latitude, loc.longitude, item.latitude, item.longitude)
        if dist <= radius_km:
            # Blockage probability for mountain roads based on district risk and proximity
            blockage_prob = round(min(98.0, (loc.baseline_risk_score * 0.8) + max(0, (25 - dist) * 1.5)), 1)
            
            dto = {
                "id": item.id,
                "name": item.name,
                "type": item.type,
                "latitude": item.latitude,
                "longitude": item.longitude,
                "distance_km": dist,
                "capacity": item.capacity,
                "criticality": item.criticality,
                "status": item.status,
                "blockage_probability": blockage_prob if item.type == "highway_corridor" else None
            }

            if item.type == "highway_corridor":
                corridors.append(dto)
            elif item.type == "bridge":
                bridges.append(dto)
            elif item.type == "hospital":
                hospitals.append(dto)
            elif item.type == "school":
                schools.append(dto)
            elif item.type == "village":
                villages.append(dto)
            elif item.type == "shelter":
                shelters.append(dto)

    # Sort each list by proximity
    corridors.sort(key=lambda x: x["distance_km"])
    bridges.sort(key=lambda x: x["distance_km"])
    hospitals.sort(key=lambda x: x["distance_km"])
    schools.sort(key=lambda x: x["distance_km"])
    villages.sort(key=lambda x: x["distance_km"])
    shelters.sort(key=lambda x: x["distance_km"])

    total_exposed_capacity = sum(v["capacity"] for v in villages) or loc.population_exposed
    total_shelter_capacity = sum(s["capacity"] for s in shelters)

    return {
        "hotspot": {
            "id": loc.id,
            "name": loc.name,
            "state": loc.state,
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "current_risk_score": loc.baseline_risk_score,
            "slope_deg": loc.slope_deg,
            "elevation_m": loc.elevation_m,
            "population_exposed": loc.population_exposed
        },
        "search_radius_km": radius_km,
        "impact_summary": {
            "highways_count": len(corridors),
            "bridges_count": len(bridges),
            "hospitals_count": len(hospitals),
            "schools_count": len(schools),
            "villages_count": len(villages),
            "shelters_count": len(shelters),
            "total_shelter_capacity": total_shelter_capacity,
            "shelter_coverage_pct": round(min(100.0, (total_shelter_capacity / (loc.population_exposed or 1)) * 100), 1)
        },
        "highway_corridors": corridors,
        "critical_bridges": bridges,
        "medical_facilities": hospitals,
        "schools": schools,
        "vulnerable_villages": villages,
        "emergency_shelters": shelters
    }
