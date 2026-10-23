from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

from app.schemas.hospital import HospitalResponse, RankedHospital

router = APIRouter(prefix="/hospitals", tags=["Hospitals & Triage"])

class BedCapacityUpdate(BaseModel):
    available_icu_beds: int
    total_icu_beds: Optional[int] = None
    readiness_score: Optional[float] = None

@router.get("", response_model=List[HospitalResponse])
async def list_hospitals(request: Request):
    """Returns all registered hospitals in the city network."""
    hospital_engine = getattr(request.app.state, "hospital_engine", None)
    if not hospital_engine:
        raise HTTPException(status_code=503, detail="Hospital Engine not initialized")
    return hospital_engine.hospitals

@router.get("/recommend", response_model=List[RankedHospital])
async def recommend_hospitals(
    request: Request,
    lat: float = Query(..., description="Ambulance current latitude"),
    lng: float = Query(..., description="Ambulance current longitude"),
    condition: str = Query("CARDIAC_ARREST", description="Patient condition e.g., CARDIAC_ARREST, TRAUMA, STROKE, BURN, PEDIATRIC"),
    specialty: Optional[str] = Query(None, description="Required medical specialty")
):
    """
    Ranks all hospitals using Multi-Criteria Decision Making (MCDM):
    Proximity (40%) + Specialty Match (30%) + ICU Capacity (20%) + Readiness (10%).
    """
    hospital_engine = getattr(request.app.state, "hospital_engine", None)
    if not hospital_engine:
        raise HTTPException(status_code=503, detail="Hospital Engine not initialized")

    ranked = hospital_engine.rank_hospitals(
        origin_lat=lat,
        origin_lng=lng,
        patient_condition=condition,
        required_specialty=specialty
    )
    return ranked

@router.put("/{hospital_id}/capacity")
async def update_hospital_capacity(
    hospital_id: str,
    payload: BedCapacityUpdate,
    request: Request
):
    """Updates ICU beds and readiness in real time."""
    hospital_engine = getattr(request.app.state, "hospital_engine", None)
    if not hospital_engine:
        raise HTTPException(status_code=503, detail="Hospital Engine not initialized")

    for h in hospital_engine.hospitals:
        if h["id"] == hospital_id:
            h["available_icu_beds"] = payload.available_icu_beds
            if payload.total_icu_beds is not None:
                h["total_icu_beds"] = payload.total_icu_beds
            if payload.readiness_score is not None:
                h["readiness_score"] = payload.readiness_score
            return {"status": "SUCCESS", "message": f"Updated capacity for {h['name']}", "hospital": h}

    raise HTTPException(status_code=404, detail=f"Hospital with id {hospital_id} not found")
