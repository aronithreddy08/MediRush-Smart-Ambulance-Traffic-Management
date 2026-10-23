import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, DateTime, Boolean, Text, Integer, ForeignKey
from app.core.database import Base

class EmergencyTrip(Base):
    __tablename__ = "emergency_trips"

    trip_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ambulance_id = Column(String, nullable=False, index=True)
    hospital_id = Column(String, nullable=True)
    patient_condition = Column(String, default="CARDIAC_ARREST")  # CARDIAC_ARREST, TRAUMA, STROKE, GENERAL
    severity = Column(String, default="CRITICAL")  # CRITICAL, HIGH, MEDIUM
    status = Column(String, default="ACTIVE")  # ACTIVE, REROUTED, COMPLETED, CANCELLED
    origin_lat = Column(Float, nullable=False)
    origin_lng = Column(Float, nullable=False)
    dest_lat = Column(Float, nullable=True)
    dest_lng = Column(Float, nullable=True)
    start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    end_time = Column(DateTime, nullable=True)
    baseline_estimated_time_min = Column(Float, default=25.0)
    final_actual_time_min = Column(Float, nullable=True)
    reroute_count = Column(Integer, default=0)

class TripRoute(Base):
    __tablename__ = "trip_routes"

    route_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String, ForeignKey("emergency_trips.trip_id"), nullable=False, index=True)
    route_type = Column(String, default="OPTIMAL_AI")  # OPTIMAL_AI, HIGHWAY_CORRIDOR, SHORTEST_DISTANCE
    geometry_json = Column(Text, nullable=False)  # JSON string of coordinates [[lat, lng], ...]
    distance_km = Column(Float, nullable=False)
    estimated_time_min = Column(Float, nullable=False)
    traffic_score = Column(Float, default=0.2)
    is_selected = Column(Boolean, default=True)
    calculated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class TripAnalytics(Base):
    __tablename__ = "trip_analytics"

    analytics_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String, ForeignKey("emergency_trips.trip_id"), unique=True, nullable=False)
    total_distance_km = Column(Float, nullable=False)
    baseline_duration_min = Column(Float, nullable=False)
    medirush_duration_min = Column(Float, nullable=False)
    time_saved_min = Column(Float, nullable=False)
    percentage_time_saved = Column(Float, nullable=False)
    signals_prioritized_count = Column(Integer, default=0)
    reroute_count = Column(Integer, default=0)
    avg_speed_kmh = Column(Float, default=52.0)
    ai_prediction_accuracy_pct = Column(Float, default=94.5)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class TripTelemetryLog(Base):
    __tablename__ = "trip_telemetry_logs"

    log_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    trip_id = Column(String, ForeignKey("emergency_trips.trip_id"), nullable=False, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed_kmh = Column(Float, default=0.0)
    bearing = Column(Float, default=0.0)
    distance_remaining_km = Column(Float, default=0.0)
    eta_seconds = Column(Float, default=0.0)
