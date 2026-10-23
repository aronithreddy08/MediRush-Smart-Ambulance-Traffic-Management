from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.hospitals import router as hospitals_router
from app.api.v1.routing import router as routing_router
from app.api.v1.emergency import router as emergency_router
from app.api.v1.signals import router as signals_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.simulation import router as simulation_router

api_v1_router = APIRouter(prefix="/api/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(hospitals_router)
api_v1_router.include_router(routing_router)
api_v1_router.include_router(emergency_router)
api_v1_router.include_router(signals_router)
api_v1_router.include_router(analytics_router)
api_v1_router.include_router(simulation_router)
