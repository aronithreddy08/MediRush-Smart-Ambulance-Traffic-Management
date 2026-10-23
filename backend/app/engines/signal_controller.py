import math
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

from app.engines.hospital_engine import haversine_distance_km

logger = logging.getLogger("medirush.signals")

class TrafficSignalController:
    def __init__(self, signals_data: List[Dict[str, Any]]):
        # Store signals in memory for sub-millisecond lookups & real-time stepping
        self.signals: Dict[str, Dict[str, Any]] = {}
        for s in signals_data:
            self.signals[s["signal_id"]] = {
                "signal_id": s["signal_id"],
                "name": s["name"],
                "latitude": float(s["latitude"]),
                "longitude": float(s["longitude"]),
                "current_state": s.get("current_state", "RED"),
                "cycle_duration_sec": int(s.get("cycle_duration_sec", 60)),
                "time_in_cycle_sec": int(s.get("time_in_cycle_sec", 0)),
                "is_preempted": bool(s.get("is_preempted", False)),
                "preemption_ambulance_id": s.get("preemption_ambulance_id"),
                "normal_green_direction": s.get("normal_green_direction", "NS"),
                "hardware_ip": s.get("hardware_ip")
            }

    def get_all_signals(self) -> List[Dict[str, Any]]:
        return list(self.signals.values())

    def get_signal(self, signal_id: str) -> Optional[Dict[str, Any]]:
        return self.signals.get(signal_id)

    def tick_simulation(self, delta_seconds: float = 1.0):
        """Advances autonomous traffic light cycles across all non-preempted signals."""
        for sig_id, sig in self.signals.items():
            if sig["is_preempted"]:
                continue  # Hold preemption green
            
            sig["time_in_cycle_sec"] = (sig["time_in_cycle_sec"] + int(delta_seconds)) % sig["cycle_duration_sec"]
            t = sig["time_in_cycle_sec"]

            # 0-25s: GREEN, 25-30s: YELLOW, 30-60s: RED
            if t < 25:
                sig["current_state"] = "GREEN"
            elif t < 30:
                sig["current_state"] = "YELLOW"
            else:
                sig["current_state"] = "RED"

    def request_preemption(self, signal_id: str, ambulance_id: str, trip_id: Optional[str] = None) -> Dict[str, Any]:
        if signal_id not in self.signals:
            return {"status": "ERROR", "message": f"Signal {signal_id} not found"}

        sig = self.signals[signal_id]
        sig["is_preempted"] = True
        sig["preemption_ambulance_id"] = ambulance_id
        sig["current_state"] = "PREEMPTION_GREEN"

        logger.info(f"🚨 SIGNAL PREEMPTION GRANTED on {signal_id} ({sig['name']}) for {ambulance_id}")

        return {
            "status": "PREEMPTION_ACTIVE",
            "signal_id": signal_id,
            "name": sig["name"],
            "state": "GREEN",
            "ambulance_id": ambulance_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def release_preemption(self, signal_id: str, ambulance_id: Optional[str] = None) -> Dict[str, Any]:
        if signal_id not in self.signals:
            return {"status": "ERROR", "message": f"Signal {signal_id} not found"}

        sig = self.signals[signal_id]
        sig["is_preempted"] = False
        sig["preemption_ambulance_id"] = None
        sig["current_state"] = "GREEN"  # Grace period normal green

        logger.info(f"Signal preemption RELEASED on {signal_id}. Returning to normal synchronized cycle.")

        return {
            "status": "NORMAL",
            "signal_id": signal_id,
            "name": sig["name"],
            "state": "GREEN",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    def check_and_update_preemption_corridor(
        self,
        ambulance_id: str,
        current_lat: float,
        current_lng: float,
        preemption_dist_meters: float = 500.0,
        clearance_dist_meters: float = 40.0
    ) -> List[Dict[str, Any]]:
        """
        Evaluates ambulance position against all signals:
        - Automatically preempts signals within 500m
        - Automatically releases signals once cleared (< 40m or passed)
        """
        events = []
        for sig_id, sig in self.signals.items():
            dist_km = haversine_distance_km(current_lat, current_lng, sig["latitude"], sig["longitude"])
            dist_meters = dist_km * 1000.0

            # Approaching & within preemption threshold
            if dist_meters <= preemption_dist_meters and not sig["is_preempted"]:
                res = self.request_preemption(sig_id, ambulance_id)
                events.append({"event": "SIGNAL_PREEMPTED", "data": res, "distance_meters": round(dist_meters, 1)})

            # Cleared intersection
            elif dist_meters > preemption_dist_meters and sig["is_preempted"] and sig["preemption_ambulance_id"] == ambulance_id:
                res = self.release_preemption(sig_id, ambulance_id)
                events.append({"event": "SIGNAL_CLEARED", "data": res})

        return events
