import math
from typing import List, Dict, Any, Optional

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class HospitalRecommendationEngine:
    def __init__(self, hospitals: List[Dict[str, Any]]):
        self.hospitals = hospitals

    def rank_hospitals(
        self,
        origin_lat: float,
        origin_lng: float,
        patient_condition: str = "CARDIAC_ARREST",
        required_specialty: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Multi-Criteria Decision Making (MCDM) weighted hospital recommendation:
        1. Travel Distance / Estimated Time (Weight: 0.40)
        2. Medical Specialty Alignment (Weight: 0.30)
        3. ICU Bed Availability (Weight: 0.20)
        4. Emergency Facility Readiness (Weight: 0.10)
        """
        condition_specialty_map = {
            "CARDIAC_ARREST": "CARDIAC",
            "TRAUMA": "TRAUMA",
            "STROKE": "NEURO",
            "BURN": "BURN",
            "PEDIATRIC": "PEDIATRIC",
            "GENERAL": "GENERAL"
        }

        target_specialty = required_specialty or condition_specialty_map.get(patient_condition.upper(), "GENERAL")

        ranked_list = []
        distances = []

        for h in self.hospitals:
            dist = haversine_distance_km(origin_lat, origin_lng, h["latitude"], h["longitude"])
            distances.append(dist)

        max_dist = max(distances) if distances and max(distances) > 0 else 10.0

        for idx, h in enumerate(self.hospitals):
            dist = distances[idx]
            # Average emergency speed proxy ~ 45 km/h + intersection buffer
            estimated_eta_min = (dist / 45.0) * 60.0 + 1.5

            # Specialty match score
            specialties = [s.strip().upper() for s in h.get("specializations", "").split(",")]
            has_specialty = target_specialty in specialties or "GENERAL" in specialties
            specialty_score = 1.0 if target_specialty in specialties else (0.6 if "GENERAL" in specialties else 0.2)

            # ICU availability ratio
            total_beds = max(1, h.get("total_icu_beds", 10))
            avail_beds = h.get("available_icu_beds", 0)
            icu_ratio = min(1.0, avail_beds / total_beds)

            # Readiness score
            readiness = float(h.get("readiness_score", 0.90))

            # Proximity score (closer = higher)
            proximity_score = max(0.0, 1.0 - (dist / (max_dist * 1.25)))

            # Composite suitability score (0 - 100%)
            composite_score = (
                0.40 * proximity_score +
                0.30 * specialty_score +
                0.20 * icu_ratio +
                0.10 * readiness
            ) * 100.0

            # Recommendation reason string
            reasons = []
            if target_specialty in specialties:
                reasons.append(f"Premier {target_specialty.capitalize()} Facility")
            if avail_beds >= 5:
                reasons.append(f"{avail_beds} ICU Beds Available")
            if dist < 4.0:
                reasons.append("Immediate Proximity")
            if not reasons:
                reasons.append("Adequate Emergency Capability")

            ranked_list.append({
                "hospital": h,
                "distance_km": round(dist, 2),
                "estimated_eta_min": round(estimated_eta_min, 1),
                "specialty_match": has_specialty,
                "icu_availability_ratio": round(icu_ratio, 2),
                "suitability_score": round(composite_score, 1),
                "is_recommended": False,
                "recommendation_reason": " | ".join(reasons)
            })

        # Sort descending by suitability score
        ranked_list.sort(key=lambda x: x["suitability_score"], reverse=True)

        if ranked_list:
            ranked_list[0]["is_recommended"] = True

        return ranked_list
