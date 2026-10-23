from typing import Optional
from datetime import datetime
from pydantic import BaseModel

class AmbulanceBase(BaseModel):
    ambulance_id: str
    driver_name: str
    vehicle_number: str
    status: str
    current_lat: float
    current_lng: float
    current_speed: float = 0.0
    heading: float = 0.0
    priority_level: str = "P1_CRITICAL"
    active_trip_id: Optional[str] = None

class AmbulanceResponse(AmbulanceBase):
    last_ping: Optional[datetime] = None

    class Config:
        from_attributes = True

class AmbulanceTelemetryUpdate(BaseModel):
    ambulance_id: str
    latitude: float
    longitude: float
    speed_kmh: float = 0.0
    heading: float = 0.0
    trip_id: Optional[str] = None
