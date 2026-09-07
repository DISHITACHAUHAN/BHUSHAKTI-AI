from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime, timezone
from backend.app.database.base import Base

class FieldReport(Base):
    __tablename__ = "field_reports"

    id = Column(Integer, primary_key=True, index=True)
    location_name = Column(String(100), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    hazard_type = Column(String(50), nullable=False)  # landslide, slope_crack, rockfall, road_blockage, water_seepage
    severity = Column(String(20), nullable=False, default="MODERATE")  # LOW, MODERATE, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    image_url = Column(String(255), nullable=True)
    reporter_role = Column(String(50), default="FIELD_RANGER")  # CITIZEN, FIELD_RANGER, NDMA_OFFICER
    verification_status = Column(String(30), default="UNDER_REVIEW")  # UNDER_REVIEW, VERIFIED, DISMISSED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
