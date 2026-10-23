import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Integer, DateTime
from app.core.database import Base

class RoadSegment(Base):
    __tablename__ = "road_segments"

    road_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    start_node_id = Column(String, nullable=False)
    end_node_id = Column(String, nullable=False)
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)
    length_km = Column(Float, nullable=False)
    speed_limit_kmh = Column(Float, default=50.0)
    road_type = Column(String, default="ARTERIAL")  # EXPRESSWAY, ARTERIAL, LOCAL
    lanes = Column(Integer, default=2)

class TrafficDataRecord(Base):
    __tablename__ = "traffic_data_records"

    record_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    road_id = Column(String, nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    current_speed_kmh = Column(Float, nullable=False)
    vehicle_density = Column(Integer, default=30)  # vehicles per km
    congestion_level = Column(Float, default=0.2)  # 0.0 to 1.0
    weather = Column(String, default="CLEAR")
