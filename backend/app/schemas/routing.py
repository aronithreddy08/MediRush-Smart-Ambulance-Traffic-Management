from typing import List, Optional, Any, Dict
from pydantic import BaseModel

class RouteCoordinate(BaseModel):
    lat: float
    lng: float

class RouteOption(BaseModel):
    route_id: str
    route_name: str
    route_type: str  # OPTIMAL_AI, HIGHWAY_CORRIDOR, SHORTEST_DISTANCE
    distance_km: float
    estimated_time_min: float
    congestion_score: float  # 0.0 to 1.0
    traffic_level_label: str  # LOW, MODERATE, HIGH, SEVERE
    coordinates: List[List[float]]  # [[lat, lng], ...]
    is_selected: bool
    ai_confidence_score: float
    time_saved_vs_baseline_min: float

class EmergencyTriggerRequest(BaseModel):
    ambulance_id: str
    origin_lat: float
    origin_lng: float
    patient_condition: str = "CARDIAC_ARREST"
    severity: str = "CRITICAL"
    destination_hospital_id: Optional[str] = None

class EmergencyTriggerResponse(BaseModel):
    trip_id: str
    ambulance_id: str
    status: str
    origin: RouteCoordinate
    target_hospital: Any
    recommended_route: RouteOption
    alternative_routes: List[RouteOption]
    all_ranked_hospitals: List[Any]
    signals_on_corridor_count: int

class TrafficPredictionRequest(BaseModel):
    road_ids: Optional[List[str]] = None
    hour_of_day: Optional[int] = None
    day_of_week: Optional[int] = None
    weather: Optional[str] = "CLEAR"

class SegmentPrediction(BaseModel):
    road_id: str
    road_name: str
    predicted_speed_kmh: float
    free_flow_speed_kmh: float
    congestion_probability: float
    congestion_level: str  # FREE_FLOW, MODERATE, HEAVY, GRIDLOCK
    risk_score: float

class TrafficPredictionResponse(BaseModel):
    timestamp: str
    hour_of_day: int
    weather: str
    predictions: List[SegmentPrediction]
    average_network_speed_kmh: float
    overall_congestion_state: str
