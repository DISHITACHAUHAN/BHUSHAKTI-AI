from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database.base import Base

class Infrastructure(Base):
    __tablename__ = "infrastructure"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # highway_corridor, bridge, hospital, school, shelter, power_substation
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=True, index=True)
    capacity = Column(Integer, default=500)
    criticality = Column(String(20), default="HIGH")  # CRITICAL, HIGH, MEDIUM
    status = Column(String(50), default="OPERATIONAL")  # OPERATIONAL, RESTRICTED, CLOSED

    # Relationships
    location = relationship("Location", back_populates="infrastructures")
