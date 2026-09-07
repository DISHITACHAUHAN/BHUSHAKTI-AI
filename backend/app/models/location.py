from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.database.base import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    state = Column(String(50), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    elevation_m = Column(Float, nullable=False, default=1000.0)
    slope_deg = Column(Float, nullable=False, default=30.0)
    soil_type = Column(String(100), default="Clay-Loam / Residual Mountain Soil")
    historical_events_count = Column(Integer, default=5)
    population_exposed = Column(Integer, default=50000)
    baseline_risk_score = Column(Float, default=20.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    weather_observations = relationship("WeatherObservation", back_populates="location", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="location", cascade="all, delete-orphan")
    infrastructures = relationship("Infrastructure", back_populates="location", cascade="all, delete-orphan")
    warnings = relationship("EarlyWarning", back_populates="location", cascade="all, delete-orphan")
