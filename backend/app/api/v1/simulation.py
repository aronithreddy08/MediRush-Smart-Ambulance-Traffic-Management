import asyncio
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.core.websocket_manager import ws_manager

router = APIRouter(prefix="/simulation", tags=["Live Demo Simulation Engine"])

class SimulationStartRequest(BaseModel):
    trip_id: str
    speed_multiplier: float = 2.0  # 2x realtime for crisp visual demos
    auto_preempt: bool = True

class TrafficJamInjection(BaseModel):
    road_id: str = "ROAD_CENTRAL_AVENUE_N"
    congestion_level: str = "GRIDLOCK"
    speed_kmh: float = 6.0

@router.post("/start-run")
async def start_simulation_run(payload: SimulationStartRequest, request: Request):
    """
    Kicks off an automated demonstration run of the active emergency trip.
    """
    from app.api.v1.emergency import active_trips
    trip = active_trips.get(payload.trip_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found. Please initiate an emergency trip first.")

    trip["status"] = "SIMULATION_IN_PROGRESS"
    
    # Broadcast simulation start
    await ws_manager.broadcast_all("SIMULATION_STARTED", {
        "trip_id": payload.trip_id,
        "speed_multiplier": payload.speed_multiplier,
        "route_coordinates": trip["recommended_route"]["coordinates"]
    })

    return {"status": "RUNNING", "trip_id": payload.trip_id, "message": "Simulation started."}

@router.post("/inject-traffic-jam")
async def inject_traffic_jam(payload: TrafficJamInjection, request: Request):
    """
    Live Demo Feature: Spikes traffic on a specific road segment,
    triggering AI recalculation and automatic dynamic reroute broadcast.
    """
    ml_engine = getattr(request.app.state, "ml_engine", None)
    if not ml_engine:
        raise HTTPException(status_code=503, detail="ML engine not initialized")

    # Broadcast bottleneck event
    jam_alert = {
        "event": "TRAFFIC_BOTTLENECK_DETECTED",
        "road_id": payload.road_id,
        "congestion_level": payload.congestion_level,
        "speed_kmh": payload.speed_kmh,
        "message": f"⚠️ AI ALERT: Sudden heavy congestion detected on {payload.road_id} (speed dropped to {payload.speed_kmh} km/h). Evaluating alternate corridors..."
    }
    await ws_manager.broadcast_all("TRAFFIC_ALERT", jam_alert)
    return {"status": "JAM_INJECTED", "details": jam_alert}

@router.post("/reset")
async def reset_simulation(request: Request):
    """
    Resets traffic signal overrides and clears active simulation trips.
    """
    signal_controller = getattr(request.app.state, "signal_controller", None)
    if signal_controller:
        for s in signal_controller.signals.values():
            s["is_preempted"] = False
            s["preemption_ambulance_id"] = None

    await ws_manager.broadcast_all("SIMULATION_RESET", {"message": "All states reset to default standby."})
    return {"status": "RESET_SUCCESSFUL"}
