import os
import json
import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import engine, Base
from app.core.websocket_manager import ws_manager
from app.api.v1 import api_v1_router

# Engines
from app.engines.ml_traffic_engine import MLTrafficPredictionEngine
from app.engines.hospital_engine import HospitalRecommendationEngine
from app.engines.signal_controller import TrafficSignalController
from app.engines.graph_routing_engine import GraphRoutingEngine
from app.engines.rerouting_engine import DynamicReroutingEngine

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("medirush.main")

# Background ticker task handle
_simulation_task = None

async def simulation_ticker_loop(signal_controller: TrafficSignalController):
    """Background task to advance normal cyclic traffic signals and broadcast updates."""
    logger.info("Traffic signal simulation ticker loop started.")
    try:
        while True:
            await asyncio.sleep(1.0)
            signal_controller.tick_simulation(delta_seconds=1.0)
            # Periodic state sync to dashboard every 2 seconds
            # await ws_manager.broadcast_dashboard("TICK", {"signals": signal_controller.get_all_signals()})
    except asyncio.CancelledError:
        logger.info("Traffic simulation ticker loop stopped.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _simulation_task
    logger.info("Initializing MediRush Core Engines & AI Models...")

    # 1. Initialize SQLite / DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database schemas verified.")

    # 2. Load ML Traffic Engine
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ml_models_dir = os.path.join(base_dir, "ml", "models")
    ml_engine = MLTrafficPredictionEngine(models_dir=ml_models_dir)
    app.state.ml_engine = ml_engine
    logger.info("ML Traffic Prediction Engine initialized.")

    # 3. Load Seed Data
    data_dir = os.path.join(base_dir, "app", "data")
    
    with open(os.path.join(data_dir, "hospitals_seed.json"), "r") as f:
        hospitals_data = json.load(f)
    hospital_engine = HospitalRecommendationEngine(hospitals=hospitals_data)
    app.state.hospital_engine = hospital_engine
    logger.info(f"Loaded {len(hospitals_data)} emergency hospitals.")

    with open(os.path.join(data_dir, "signals_seed.json"), "r") as f:
        signals_data = json.load(f)
    signal_controller = TrafficSignalController(signals_data=signals_data)
    app.state.signal_controller = signal_controller
    logger.info(f"Loaded {len(signals_data)} smart traffic signals.")

    with open(os.path.join(data_dir, "road_network.json"), "r") as f:
        road_network_data = json.load(f)
    routing_engine = GraphRoutingEngine(road_network_data=road_network_data, ml_engine=ml_engine)
    app.state.routing_engine = routing_engine
    logger.info(f"Constructed city road graph ({len(routing_engine.nodes)} nodes, {len(routing_engine.edges)} road segments).")

    rerouting_engine = DynamicReroutingEngine(hysteresis_threshold_seconds=settings.REROUTE_ETA_THRESHOLD_SECONDS)
    app.state.rerouting_engine = rerouting_engine

    # 4. Start Background Simulation Loop
    _simulation_task = asyncio.create_task(simulation_ticker_loop(signal_controller))

    logger.info("MediRush backend is fully operational and ready for emergency coordination.")
    yield

    # Teardown
    if _simulation_task:
        _simulation_task.cancel()
    await engine.dispose()
    logger.info("MediRush backend cleanly stopped.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Powered Smart Ambulance Emergency Coordination, Dynamic Routing and Traffic Management System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routes
app.include_router(api_v1_router)

@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "MediRush AI Emergency Coordination Platform",
        "status": "ONLINE",
        "version": "1.0.0",
        "docs": "/docs",
        "timestamp": "2026-08-15"
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "engines": "operational"}

# WebSocket Endpoints
@app.websocket("/ws/dashboard")
async def websocket_dashboard_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket, client_type="dashboard")
    try:
        # Send initial full state snapshot
        signal_controller = getattr(websocket.app.state, "signal_controller", None)
        hospital_engine = getattr(websocket.app.state, "hospital_engine", None)
        
        await websocket.send_json({
            "type": "INITIAL_SNAPSHOT",
            "data": {
                "signals": signal_controller.get_all_signals() if signal_controller else [],
                "hospitals": hospital_engine.hospitals if hospital_engine else []
            }
        })
        
        while True:
            data = await websocket.receive_text()
            # Dashboard can send commands or triggers
            logger.debug(f"Received dashboard WS msg: {data}")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)

@app.websocket("/ws/driver/{ambulance_id}")
async def websocket_driver_endpoint(websocket: WebSocket, ambulance_id: str):
    await ws_manager.connect(websocket, client_type="driver", client_id=ambulance_id)
    try:
        while True:
            data_str = await websocket.receive_text()
            data = json.loads(data_str)
            msg_type = data.get("type")

            if msg_type == "TELEMETRY":
                # Real-time GPS coordinate from driver app
                lat = data["lat"]
                lng = data["lng"]
                
                # Check proximity to traffic signals for green corridor preemption
                sig_controller = getattr(websocket.app.state, "signal_controller", None)
                if sig_controller:
                    events = sig_controller.check_and_update_preemption_corridor(
                        ambulance_id=ambulance_id,
                        current_lat=lat,
                        current_lng=lng
                    )
                    for ev in events:
                        await ws_manager.broadcast_all(ev["event"], ev["data"])

                # Forward telemetry to dispatcher dashboard
                await ws_manager.broadcast_dashboard("AMBULANCE_MOVED", {
                    "ambulance_id": ambulance_id,
                    "lat": lat,
                    "lng": lng,
                    "speed_kmh": data.get("speed_kmh", 55.0),
                    "heading": data.get("heading", 0.0)
                })

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"Driver WebSocket error: {e}")
        ws_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
