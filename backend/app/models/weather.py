from sqlalchemy import Column, Integer, Float, DateTime, Boolean, ForeignKey, String
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from backend.app.database.base import Base

class WeatherObservation(Base):
    __tablename__ = "weather_observations"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False, index=True)
    rainfall_24h_mm = Column(Float, nullable=False, default=0.0)
    rainfall_intensity_mmh = Column(Float, nullable=False, default=0.0)
    soil_moisture_pct = Column(Float, nullable=False, default=30.0)
    temperature_c = Column(Float, default=22.0)
    humidity_pct = Column(Float, default=75.0)
    pore_water_pressure_kpa = Column(Float, default=10.0)
    is_simulated = Column(Boolean, default=True)  # Clearly labels demo/simulated vs live data
    data_source = Column(String(50), default="SIMULATED_INGESTION_ENGINE")
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    # Relationships
    location = relationship("Location", back_populates="weather_observations")
