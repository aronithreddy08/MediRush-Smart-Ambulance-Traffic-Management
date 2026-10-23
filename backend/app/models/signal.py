import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey
from app.core.database import Base

class TrafficSignal(Base):
    __tablename__ = "traffic_signals"

    signal_id = Column(String, primary_key=True, index=True)  # e.g., "SIG-01"
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    current_state = Column(String, default="RED")  # RED, YELLOW, GREEN, PREEMPTION_GREEN
    cycle_duration_sec = Column(Integer, default=60)
    time_in_cycle_sec = Column(Integer, default=0)
    is_preempted = Column(Boolean, default=False)
    preemption_ambulance_id = Column(String, nullable=True)
    normal_green_direction = Column(String, default="NS")  # NS (North-South) or EW (East-West)
    hardware_ip = Column(String, nullable=True)

class SignalPreemptionEvent(Base):
    __tablename__ = "signal_preemption_events"

    event_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    signal_id = Column(String, ForeignKey("traffic_signals.signal_id"), nullable=False, index=True)
    trip_id = Column(String, nullable=True)
    ambulance_id = Column(String, nullable=False)
    requested_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    green_granted_at = Column(DateTime, nullable=True)
    cleared_at = Column(DateTime, nullable=True)
    status = Column(String, default="COMPLETED")
