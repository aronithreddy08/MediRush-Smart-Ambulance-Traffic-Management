import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.schemas.routing import EmergencyTriggerRequest, EmergencyTriggerResponse, RouteOption, RouteCoordinate
from app.core.websocket_manager import ws_manager

router = APIRouter(prefix="/emergency", tags=["Emergency Coordination"])

class CompleteTripRequest(BaseModel):
    trip_id: str
    ambulance_id: str
    total_elapsed_seconds: float
    actual_distance_km: float
    signals_cleared_count: int
    reroutes_count: int = 0
    baseline_estimated_seconds: float

# In-memory active trips store for instant fast lookups
active_trips: Dict[str, Dict[str, Any]] = {}

@router.post("/initiate", response_model=EmergencyTriggerResponse)
async def initiate_emergency(payload: EmergencyTriggerRequest, request: Request):
    """
    Emergency Trigger Workflow (Driver SOS Button):
    1. Receives ambulance GPS coordinates & patient condition
    2. Runs Multi-Criteria Decision Making (MCDM) to rank nearest suitable hospitals
    3. Computes AI-optimized dynamic route and alternatives to the recommended hospital
    4. Automatically queries and registers signals along the corridor
    5. Broadcasts live emergency alert to dispatcher dashboard via WebSocket
    """
    hospital_engine = getattr(request.app.state, "hospital_engine", None)
    routing_engine = getattr(request.app.state, "routing_engine", None)
    signal_controller = getattr(request.app.state, "signal_controller", None)

    if not hospital_engine or not routing_engine or not signal_controller:
        raise HTTPException(status_code=503, detail="Emergency engines not initialized")

    # Step 1: Rank hospitals
    ranked_hospitals = hospital_engine.rank_hospitals(
        origin_lat=payload.origin_lat,
        origin_lng=payload.origin_lng,
        patient_condition=payload.patient_condition
    )

    if not ranked_hospitals:
        raise HTTPException(status_code=404, detail="No suitable hospitals found in operational zone")

    # Select target hospital (either specified or highest ranked)
    target_item = ranked_hospitals[0]
    if payload.destination_hospital_id:
        for h in ranked_hospitals:
            if h["hospital"]["id"] == payload.destination_hospital_id:
                target_item = h
                break

    target_hospital = target_item["hospital"]

    # Step 2: Calculate multi-modal routes
    routes = routing_engine.compute_route_paths(
        origin_lat=payload.origin_lat,
        origin_lng=payload.origin_lng,
        dest_lat=target_hospital["latitude"],
        dest_lng=target_hospital["longitude"]
    )

    recommended_route = routes[0]
    alternatives = routes[1:] if len(routes) > 1 else []

    # Step 3: Count upcoming signals
    signals_count = len(signal_controller.signals)

    trip_id = f"TRIP_{uuid.uuid4().hex[:8].upper()}"

    trip_data = {
        "trip_id": trip_id,
        "ambulance_id": payload.ambulance_id,
        "status": "ACTIVE_EMERGENCY",
        "origin": {"lat": payload.origin_lat, "lng": payload.origin_lng},
        "target_hospital": target_hospital,
        "recommended_route": recommended_route,
        "alternative_routes": alternatives,
        "all_ranked_hospitals": ranked_hospitals,
        "signals_on_corridor_count": signals_count,
        "patient_condition": payload.patient_condition,
        "severity": payload.severity,
        "start_time": datetime.now(timezone.utc).isoformat()
    }
    active_trips[trip_id] = trip_data

    # Step 4: Broadcast to Dispatcher Dashboard in real-time
    await ws_manager.broadcast_dashboard("EMERGENCY_TRIGGERED", trip_data)

    return trip_data

@router.get("/active/{trip_id}")
async def get_active_trip(trip_id: str):
    trip = active_trips.get(trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail=f"Active trip {trip_id} not found")
    return trip

@router.post("/complete-trip")
async def complete_emergency_trip(payload: CompleteTripRequest):
    """
    Finalizes an emergency run, computes performance telemetry, and broadcasts completion.
    """
    trip = active_trips.get(payload.trip_id, {})
    
    time_saved_sec = max(0.0, payload.baseline_estimated_seconds - payload.total_elapsed_seconds)
    time_saved_min = round(time_saved_sec / 60.0, 1)

    summary = {
        "trip_id": payload.trip_id,
        "ambulance_id": payload.ambulance_id,
        "status": "COMPLETED",
        "total_duration_minutes": round(payload.total_elapsed_seconds / 60.0, 1),
        "actual_distance_km": payload.actual_distance_km,
        "signals_cleared_on_green": payload.signals_cleared_count,
        "reroutes_triggered": payload.reroutes_count,
        "time_saved_vs_standard_gps_min": time_saved_min,
        "average_speed_kmh": round((payload.actual_distance_km / max(0.001, payload.total_elapsed_seconds / 3600.0)), 1),
        "hospital_name": trip.get("target_hospital", {}).get("name", "Apex Super Specialty Hospital"),
        "completed_at": datetime.now(timezone.utc).isoformat()
    }

    if payload.trip_id in active_trips:
        active_trips[payload.trip_id]["status"] = "COMPLETED"

    # Broadcast debrief to both dashboard and driver
    await ws_manager.broadcast_dashboard("EMERGENCY_COMPLETED", summary)
    await ws_manager.send_to_ambulance(payload.ambulance_id, "EMERGENCY_COMPLETED", summary)

    return summary
