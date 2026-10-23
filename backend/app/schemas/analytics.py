from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

class TripAnalyticsResponse(BaseModel):
    trip_id: str
    ambulance_id: str
    total_distance_km: float
    baseline_duration_min: float
    medirush_duration_min: float
    time_saved_min: float
    percentage_time_saved: float
    signals_prioritized_count: int
    reroute_count: int
    avg_speed_kmh: float
    ai_prediction_accuracy_pct: float
    created_at: datetime

    class Config:
        from_attributes = True

class SystemBenchmarkSummary(BaseModel):
    total_emergencies_handled: int
    total_minutes_saved: float
    average_time_reduction_percentage: float
    total_signals_preempted: int
    ai_model_r2_score: float
    ai_model_mae_kmh: float
    active_fleet_count: int
    connected_signals_count: int
