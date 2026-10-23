from app.schemas.auth import Token, LoginRequest, UserCreate, UserResponse
from app.schemas.ambulance import AmbulanceBase, AmbulanceResponse, AmbulanceTelemetryUpdate
from app.schemas.hospital import HospitalResponse, HospitalRecommendationRequest, RankedHospital
from app.schemas.routing import (
    RouteCoordinate,
    RouteOption,
    EmergencyTriggerRequest,
    EmergencyTriggerResponse,
    TrafficPredictionRequest,
    SegmentPrediction,
    TrafficPredictionResponse
)
from app.schemas.signal import SignalResponse, SignalPriorityRequest, SignalStateOverride
from app.schemas.analytics import TripAnalyticsResponse, SystemBenchmarkSummary

__all__ = [
    "Token",
    "LoginRequest",
    "UserCreate",
    "UserResponse",
    "AmbulanceBase",
    "AmbulanceResponse",
    "AmbulanceTelemetryUpdate",
    "HospitalResponse",
    "HospitalRecommendationRequest",
    "RankedHospital",
    "RouteCoordinate",
    "RouteOption",
    "EmergencyTriggerRequest",
    "EmergencyTriggerResponse",
    "TrafficPredictionRequest",
    "SegmentPrediction",
    "TrafficPredictionResponse",
    "SignalResponse",
    "SignalPriorityRequest",
    "SignalStateOverride",
    "TripAnalyticsResponse",
    "SystemBenchmarkSummary"
]
