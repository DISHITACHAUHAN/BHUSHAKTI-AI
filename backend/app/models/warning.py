from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.database.base import Base

class EarlyWarning(Base):
    __tablename__ = "early_warnings"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)  # LOW, MODERATE, HIGH, CRITICAL
    risk_probability = Column(Float, nullable=False)
    main_factors = Column(Text, nullable=False)  # JSON or comma-separated summary of dominant triggers
    recommended_action = Column(Text, nullable=False)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    location = relationship("Location", back_populates="warnings")
