from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.schemas.routing import RouteOption, TrafficPredictionRequest, TrafficPredictionResponse, SegmentPrediction

router = APIRouter(prefix="/routing", tags=["Routing & AI Optimization"])

class RouteCalculationRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    destination_lat: float
    destination_lng: float
    weather: Optional[str] = "CLEAR"
    preempted_signals: Optional[List[str]] = None

class RerouteEvaluationRequest(BaseModel):
    current_route: Dict[str, Any]
    current_lat: float
    current_lng: float
    destination_lat: float
    destination_lng: float
    current_progress_ratio: float = 0.0
    weather: Optional[str] = "CLEAR"

@router.post("/calculate", response_model=List[RouteOption])
async def calculate_routes(payload: RouteCalculationRequest, request: Request):
    """
    Computes candidate emergency routes:
    1. AI-Optimized Corridor (minimizes travel time + dynamic congestion penalty + preempts traffic signals)
    2. Arterial Expressway Corridor (prefers higher-capacity avenues)
    3. Baseline Shortest Distance (pure geometric distance)
    """
    routing_engine = getattr(request.app.state, "routing_engine", None)
    if not routing_engine:
        raise HTTPException(status_code=503, detail="Routing Engine not initialized")

    routes = routing_engine.compute_route_paths(
        origin_lat=payload.origin_lat,
        origin_lng=payload.origin_lng,
        dest_lat=payload.destination_lat,
        dest_lng=payload.destination_lng,
        preempted_signals=payload.preempted_signals,
        weather=payload.weather or "CLEAR"
    )
    return routes

@router.post("/predict-traffic", response_model=TrafficPredictionResponse)
async def predict_traffic(payload: TrafficPredictionRequest, request: Request):
    """
    Returns AI-predicted traffic speeds and congestion classifications across all city road segments.
    """
    ml_engine = getattr(request.app.state, "ml_engine", None)
    routing_engine = getattr(request.app.state, "routing_engine", None)
    if not ml_engine or not routing_engine:
        raise HTTPException(status_code=503, detail="ML Traffic Engine not initialized")

    edges = [{"id": e["id"], "road_type": e.get("road_type", "ARTERIAL"), "speed_limit_kmh": e.get("speed_limit_kmh", 45)} for e in routing_engine.edges]
    predictions = ml_engine.predict_segments(
        edges,
        hour_of_day=payload.hour_of_day,
        day_of_week=payload.day_of_week,
        weather=payload.weather or "CLEAR"
    )

    avg_speed = sum(p["predicted_speed_kmh"] for p in predictions) / len(predictions) if predictions else 45.0
    overall_state = "FREE_FLOW" if avg_speed > 42.0 else ("MODERATE" if avg_speed > 28.0 else ("HEAVY" if avg_speed > 16.0 else "GRIDLOCK"))

    return {
        "timestamp": ml_engine.get_current_timestamp_iso(),
        "hour_of_day": payload.hour_of_day or 14,
        "weather": payload.weather or "CLEAR",
        "predictions": predictions,
        "average_network_speed_kmh": round(avg_speed, 1),
        "overall_congestion_state": overall_state
    }

@router.post("/check-reroute")
async def check_reroute(payload: RerouteEvaluationRequest, request: Request):
    """
    Evaluates in real-time whether a traffic spike or bottleneck warrants an automatic reroute.
    """
    routing_engine = getattr(request.app.state, "routing_engine", None)
    rerouting_engine = getattr(request.app.state, "rerouting_engine", None)
    if not routing_engine or not rerouting_engine:
        raise HTTPException(status_code=503, detail="Engines not initialized")

    candidate_routes = routing_engine.compute_route_paths(
        origin_lat=payload.current_lat,
        origin_lng=payload.current_lng,
        dest_lat=payload.destination_lat,
        dest_lng=payload.destination_lng,
        weather=payload.weather or "CLEAR"
    )

    should_reroute, best_route, reason = rerouting_engine.evaluate_reroute(
        current_route=payload.current_route,
        candidate_routes=candidate_routes,
        current_progress_ratio=payload.current_progress_ratio
    )

    return {
        "should_reroute": should_reroute,
        "reason": reason,
        "new_route": best_route,
        "candidate_routes": candidate_routes
    }
