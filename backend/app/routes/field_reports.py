from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from backend.app.database.session import get_db
from backend.app.models.field_report import FieldReport
from backend.app.schemas.field_report import (
    FieldReportCreate,
    FieldReportResponse,
    FieldReportStatusUpdate
)

router = APIRouter(prefix="/api/field-reports", tags=["Citizen & Field Intelligence"])

@router.get("", response_model=List[FieldReportResponse])
def get_field_reports(db: Session = Depends(get_db)):
    """
    Returns all field and citizen ground reports.
    """
    return db.query(FieldReport).order_by(FieldReport.created_at.desc()).all()

@router.post("", response_model=FieldReportResponse, status_code=status.HTTP_201_CREATED)
def submit_field_report(report_in: FieldReportCreate, db: Session = Depends(get_db)):
    """
    Submits a new hazard report from field rangers or citizens.
    """
    new_report = FieldReport(
        location_name=report_in.location_name,
        latitude=report_in.latitude,
        longitude=report_in.longitude,
        hazard_type=report_in.hazard_type,
        severity=report_in.severity,
        description=report_in.description,
        image_url=report_in.image_url,
        reporter_role=report_in.reporter_role,
        verification_status="UNDER_REVIEW",
        created_at=datetime.now(timezone.utc)
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.patch("/{report_id}/status", response_model=FieldReportResponse)
def update_report_status(
    report_id: int,
    status_update: FieldReportStatusUpdate,
    db: Session = Depends(get_db)
):
    """
    Updates the verification status of a ground report.
    """
    report = db.query(FieldReport).filter(FieldReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Field report not found")

    report.verification_status = status_update.verification_status
    db.commit()
    db.refresh(report)
    return report
