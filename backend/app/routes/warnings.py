from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from backend.app.database.session import get_db
from backend.app.models.warning import EarlyWarning
from backend.app.models.location import Location
from backend.app.schemas.warning import EarlyWarningResponse, WarningAcknowledgeRequest
from backend.app.services.alert_service import alert_service

router = APIRouter(prefix="/api/warnings", tags=["Early Warnings Engine"])

class BroadcastRequest(BaseModel):
    channels: List[str] = Field(["SMS", "CAP_BROADCAST", "RADIO_SIREN"], description="Broadcast channels to trigger")

class ThresholdsUpdateRequest(BaseModel):
    thresholds: Dict[str, float]

@router.get("", response_model=List[EarlyWarningResponse])
def get_warnings(
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MODERATE, HIGH, CRITICAL"),
    acknowledged: Optional[bool] = Query(None, description="Filter by acknowledged status"),
    db: Session = Depends(get_db)
):
    """
    Returns list of early warnings with full location context.
    """
    query = db.query(EarlyWarning)
    if severity:
        query = query.filter(EarlyWarning.severity == severity.upper())
    if acknowledged is not None:
        query = query.filter(EarlyWarning.acknowledged == acknowledged)

    warnings = query.order_by(EarlyWarning.created_at.desc()).all()
    results = []

    for w in warnings:
        loc = db.query(Location).filter(Location.id == w.location_id).first()
        results.append(
            EarlyWarningResponse(
                id=w.id,
                location_id=w.location_id,
                location_name=loc.name if loc else "Unknown District",
                state=loc.state if loc else "Unknown State",
                latitude=loc.latitude if loc else None,
                longitude=loc.longitude if loc else None,
                severity=w.severity,
                risk_probability=w.risk_probability,
                main_factors=w.main_factors,
                recommended_action=w.recommended_action,
                acknowledged=w.acknowledged,
                acknowledged_by=w.acknowledged_by,
                acknowledged_at=w.acknowledged_at,
                created_at=w.created_at
            )
        )

    return results

@router.get("/thresholds")
def get_operational_thresholds():
    """
    Returns active prototype operational thresholds and scientific disclaimer.
    """
    return alert_service.get_thresholds()

@router.post("/thresholds")
def update_operational_thresholds(payload: ThresholdsUpdateRequest):
    """
    Updates operational risk threshold configurations.
    """
    return alert_service.update_thresholds(payload.thresholds)

@router.post("/{warning_id}/acknowledge", response_model=EarlyWarningResponse)
def acknowledge_warning(
    warning_id: int,
    payload: WarningAcknowledgeRequest,
    db: Session = Depends(get_db)
):
    """
    Logs formal duty officer acknowledgment for an early warning.
    """
    warning = db.query(EarlyWarning).filter(EarlyWarning.id == warning_id).first()
    if not warning:
        raise HTTPException(status_code=404, detail="Early warning not found")

    warning.acknowledged = True
    warning.acknowledged_by = payload.operator_name
    warning.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(warning)

    loc = db.query(Location).filter(Location.id == warning.location_id).first()
    return EarlyWarningResponse(
        id=warning.id,
        location_id=warning.location_id,
        location_name=loc.name if loc else "Unknown",
        state=loc.state if loc else "Unknown",
        latitude=loc.latitude if loc else None,
        longitude=loc.longitude if loc else None,
        severity=warning.severity,
        risk_probability=warning.risk_probability,
        main_factors=warning.main_factors,
        recommended_action=warning.recommended_action,
        acknowledged=warning.acknowledged,
        acknowledged_by=warning.acknowledged_by,
        acknowledged_at=warning.acknowledged_at,
        created_at=warning.created_at
    )

@router.post("/{warning_id}/broadcast")
def broadcast_warning(
    warning_id: int,
    payload: BroadcastRequest,
    db: Session = Depends(get_db)
):
    """
    Simulates emergency alert dissemination across SMS, NDMA CAP, and siren channels.
    """
    try:
        return alert_service.simulate_broadcast(warning_id, payload.channels, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
