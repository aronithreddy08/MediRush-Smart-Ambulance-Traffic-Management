from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime
from app.core.database import Base

class Ambulance(Base):
    __tablename__ = "ambulances"

    ambulance_id = Column(String, primary_key=True, index=True)  # e.g., "AMB-01"
    driver_name = Column(String, nullable=False, default="Emergency Responder")
    vehicle_number = Column(String, nullable=False)
    status = Column(String, nullable=False, default="IDLE")  # IDLE, DISPATCHED, IN_TRANSIT, RETURNING
    current_lat = Column(Float, nullable=False, default=12.9716)
    current_lng = Column(Float, nullable=False, default=77.5946)
    current_speed = Column(Float, default=0.0)
    heading = Column(Float, default=0.0)
    priority_level = Column(String, default="P1_CRITICAL")  # P1_CRITICAL, P2_URGENT, P3_STANDARD
    active_trip_id = Column(String, nullable=True)
    last_ping = Column(DateTime, default=lambda: datetime.now(timezone.utc))
