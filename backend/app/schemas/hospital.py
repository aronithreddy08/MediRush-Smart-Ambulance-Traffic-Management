from typing import List, Optional
from pydantic import BaseModel

class HospitalResponse(BaseModel):
    hospital_id: str
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    emergency_capability: bool
    specializations: str
    total_icu_beds: int
    available_icu_beds: int
    contact_phone: str
    readiness_score: float

    class Config:
        from_attributes = True

class HospitalRecommendationRequest(BaseModel):
    origin_lat: float
    origin_lng: float
    patient_condition: str = "CARDIAC_ARREST"
    required_specialty: Optional[str] = None

class RankedHospital(BaseModel):
    hospital: HospitalResponse
    distance_km: float
    estimated_eta_min: float
    specialty_match: bool
    icu_availability_ratio: float
    suitability_score: float  # 0.0 to 100.0%
    is_recommended: bool
    recommendation_reason: str
