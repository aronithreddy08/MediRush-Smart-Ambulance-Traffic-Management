import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediRush"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "medirush_super_secret_jwt_key_2026_saving_lives")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./medirush.db")

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
        "*"
    ]

    # Simulation settings
    SIMULATION_TICK_RATE_MS: int = 500
    REROUTE_ETA_THRESHOLD_SECONDS: float = 90.0  # 1.5 min threshold for rerouting
    SIGNAL_PREEMPTION_DISTANCE_METERS: float = 500.0
    SIGNAL_CLEARANCE_DISTANCE_METERS: float = 40.0

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
