import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger("medirush.rerouting")

class DynamicReroutingEngine:
    def __init__(self, hysteresis_threshold_seconds: float = 90.0):
        self.hysteresis_threshold_sec = hysteresis_threshold_seconds

    def evaluate_reroute(
        self,
        current_route: Dict[str, Any],
        candidate_routes: list[Dict[str, Any]],
        current_progress_ratio: float = 0.0
    ) -> Tuple[bool, Optional[Dict[str, Any]], str]:
        """
        Evaluates whether dynamic rerouting is justified.
        Returns (should_reroute, new_best_route, reason)
        """
        if not candidate_routes:
            return False, None, "No alternative routes available"

        # Find fastest candidate route
        sorted_candidates = sorted(candidate_routes, key=lambda r: r["estimated_time_min"])
        best_candidate = sorted_candidates[0]

        # Current remaining time estimate
        remaining_time_current_min = current_route["estimated_time_min"] * (1.0 - min(0.95, current_progress_ratio))
        new_estimated_time_min = best_candidate["estimated_time_min"]

        time_delta_seconds = (remaining_time_current_min - new_estimated_time_min) * 60.0

        if best_candidate["route_id"] != current_route["route_id"] and time_delta_seconds > self.hysteresis_threshold_sec:
            reason = f"Dynamic Reroute Triggered: AI detected bottleneck ahead on current corridor. Alternate route saves {round(time_delta_seconds / 60.0, 1)} min."
            logger.info(f"🔄 {reason}")
            return True, best_candidate, reason

        return False, None, "Current route remains optimal within hysteresis threshold."
