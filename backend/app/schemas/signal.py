from typing import Optional
from pydantic import BaseModel

class SignalResponse(BaseModel):
    signal_id: str
    name: str
    latitude: float
    longitude: float
    current_state: str  # RED, YELLOW, GREEN, PREEMPTION_GREEN
    cycle_duration_sec: int
    time_in_cycle_sec: int
    is_preempted: bool
    preemption_ambulance_id: Optional[str] = None
    normal_green_direction: str

    class Config:
        from_attributes = True

class SignalPriorityRequest(BaseModel):
    signal_id: str
    ambulance_id: str
    trip_id: Optional[str] = None
    distance_meters: float
    speed_kmh: float

class SignalStateOverride(BaseModel):
    signal_id: str
    state: str  # RED, YELLOW, GREEN, PREEMPTION_GREEN
    is_preempted: bool = False
    ambulance_id: Optional[str] = None
