from typing import List, Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.schemas.signal import SignalResponse, SignalPriorityRequest, SignalStateOverride
from app.core.websocket_manager import ws_manager

router = APIRouter(prefix="/signals", tags=["Smart Traffic Signals & Green Wave"])

class ProximityCheckRequest(BaseModel):
    ambulance_id: str
    latitude: float
    longitude: float
    preemption_radius_meters: float = 500.0

class HardwareSyncRequest(BaseModel):
    device_id: str
    signal_id: str
    ip_address: Optional[str] = None
    firmware_version: Optional[str] = "1.0.0-ESP32"

@router.get("", response_model=List[SignalResponse])
async def list_signals(request: Request):
    """Returns real-time status, cycles, and preemption flags for all city traffic signals."""
    signal_controller = getattr(request.app.state, "signal_controller", None)
    if not signal_controller:
        raise HTTPException(status_code=503, detail="Signal Controller not initialized")
    return signal_controller.get_all_signals()

@router.post("/override")
async def override_signal_state(payload: SignalStateOverride, request: Request):
    """
    Manual dispatcher override for traffic signal state.
    """
    signal_controller = getattr(request.app.state, "signal_controller", None)
    if not signal_controller:
        raise HTTPException(status_code=503, detail="Signal Controller not initialized")

    sig = signal_controller.get_signal(payload.signal_id)
    if not sig:
        raise HTTPException(status_code=404, detail=f"Signal {payload.signal_id} not found")

    sig["current_state"] = payload.state
    sig["is_preempted"] = (payload.state == "GREEN" or payload.state == "PREEMPTION_GREEN")

    # Broadcast updated state
    await ws_manager.broadcast_all("SIGNAL_STATE_CHANGED", sig)
    return {"status": "SUCCESS", "signal": sig}

@router.post("/priority-preempt")
async def request_priority(payload: SignalPriorityRequest, request: Request):
    """
    Initiates emergency Green Corridor preemption for an approaching ambulance.
    """
    signal_controller = getattr(request.app.state, "signal_controller", None)
    if not signal_controller:
        raise HTTPException(status_code=503, detail="Signal Controller not initialized")

    res = signal_controller.request_preemption(payload.signal_id, payload.ambulance_id, payload.trip_id)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res["message"])

    sig = signal_controller.get_signal(payload.signal_id)
    await ws_manager.broadcast_all("SIGNAL_PREEMPTED", sig)
    return res

@router.post("/priority-release")
async def release_priority(signal_id: str, ambulance_id: Optional[str] = None, request: Request = None):
    """
    Releases Green Corridor hold and restores normal synchronized cyclic operation.
    """
    signal_controller = getattr(request.app.state, "signal_controller", None)
    if not signal_controller:
        raise HTTPException(status_code=503, detail="Signal Controller not initialized")

    res = signal_controller.release_preemption(signal_id, ambulance_id)
    if res.get("status") == "ERROR":
        raise HTTPException(status_code=404, detail=res["message"])

    sig = signal_controller.get_signal(signal_id)
    await ws_manager.broadcast_all("SIGNAL_RELEASED", sig)
    return res

@router.post("/check-proximity")
async def check_proximity(payload: ProximityCheckRequest, request: Request):
    """
    Heartbeat evaluation: Auto-preempts signals within 500m radius of ambulance.
    """
    signal_controller = getattr(request.app.state, "signal_controller", None)
    if not signal_controller:
        raise HTTPException(status_code=503, detail="Signal Controller not initialized")

    events = signal_controller.check_and_update_preemption_corridor(
        ambulance_id=payload.ambulance_id,
        current_lat=payload.latitude,
        current_lng=payload.longitude,
        preemption_dist_meters=payload.preemption_radius_meters
    )

    if events:
        for ev in events:
            await ws_manager.broadcast_all(ev["event"], ev["data"])

    return {"events": events, "active_preemptions": [s for s in signal_controller.get_all_signals() if s["is_preempted"]]}

@router.post("/hardware-ping")
async def hardware_ping(payload: HardwareSyncRequest, request: Request):
    """
    ESP32 / Arduino hardware node heartbeat and state polling.
    """
    signal_controller = getattr(request.app.state, "signal_controller", None)
    if not signal_controller:
        raise HTTPException(status_code=503, detail="Signal Controller not initialized")

    sig = signal_controller.get_signal(payload.signal_id)
    if not sig:
        return {"status": "REGISTERED_NEW", "signal_id": payload.signal_id, "current_state": "RED"}

    return {
        "status": "SYNCED",
        "signal_id": payload.signal_id,
        "name": sig["name"],
        "current_state": sig["current_state"],
        "is_preempted": sig["is_preempted"]
    }
