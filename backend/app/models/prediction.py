from sqlalchemy import Column, Integer, Float, DateTime, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.database.base import Base

class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True, index=True)
    risk_probability = Column(Float, nullable=False)
    risk_category = Column(String(50), nullable=False)  # LOW, MODERATE, HIGH, CRITICAL
    input_features = Column(JSON, nullable=False)
    shap_values = Column(JSON, nullable=True)
    contributing_factors = Column(JSON, nullable=True)
    model_version = Column(String(50), default="xgboost_v1.0")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    location = relationship("Location", back_populates="predictions")
