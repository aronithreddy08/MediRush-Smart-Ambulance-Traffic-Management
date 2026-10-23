import pytest
import os
import json
from starlette.testclient import TestClient

from main import app
from app.engines.hospital_engine import HospitalRecommendationEngine, haversine_distance_km
from app.engines.signal_controller import TrafficSignalController
from app.engines.ml_traffic_engine import MLTrafficPredictionEngine
from app.engines.graph_routing_engine import GraphRoutingEngine
from app.engines.rerouting_engine import DynamicReroutingEngine

@pytest.fixture
def sample_data():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(base_dir, "app", "data")
    with open(os.path.join(data_dir, "hospitals_seed.json")) as f:
        hospitals = json.load(f)
    with open(os.path.join(data_dir, "signals_seed.json")) as f:
        signals = json.load(f)
    with open(os.path.join(data_dir, "road_network.json")) as f:
        network = json.load(f)
    return hospitals, signals, network

def test_haversine_distance():
    dist = haversine_distance_km(28.6139, 77.2090, 28.6250, 77.2180)
    assert 1.0 < dist < 2.5

def test_hospital_mcdm_ranking(sample_data):
    hospitals, _, _ = sample_data
    engine = HospitalRecommendationEngine(hospitals)
    
    ranked = engine.rank_hospitals(
        origin_lat=28.6139,
        origin_lng=77.2090,
        patient_condition="CARDIAC_ARREST"
    )
    
    assert len(ranked) == len(hospitals)
    assert ranked[0]["is_recommended"] is True
    assert ranked[0]["suitability_score"] >= ranked[-1]["suitability_score"]
    assert "CARDIAC" in ranked[0]["hospital"]["specializations"] or "GENERAL" in ranked[0]["hospital"]["specializations"]

def test_traffic_signal_preemption(sample_data):
    _, signals, _ = sample_data
    controller = TrafficSignalController(signals)
    
    sig_id = signals[0]["signal_id"]
    res = controller.request_preemption(sig_id, ambulance_id="AMB_01")
    assert res["status"] == "PREEMPTION_ACTIVE"
    
    sig = controller.get_signal(sig_id)
    assert sig["is_preempted"] is True
    assert sig["current_state"] == "PREEMPTION_GREEN"
    
    res_rel = controller.release_preemption(sig_id, ambulance_id="AMB_01")
    assert res_rel["status"] == "NORMAL"
    assert sig["is_preempted"] is False

def test_ml_traffic_engine_predictions():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "ml", "models")
    ml_engine = MLTrafficPredictionEngine(models_dir=models_dir)
    
    test_segments = [
        {"id": "ROAD_01", "road_type": "PRIMARY", "speed_limit_kmh": 50},
        {"id": "ROAD_02", "road_type": "EXPRESSWAY", "speed_limit_kmh": 80}
    ]
    preds = ml_engine.predict_segments(test_segments, hour_of_day=17, weather="RAIN")
    assert len(preds) == 2
    for p in preds:
        assert "predicted_speed_kmh" in p
        assert "congestion_level" in p
        assert p["predicted_speed_kmh"] > 0

def test_graph_routing_dynamic_astar(sample_data):
    _, _, network = sample_data
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "ml", "models")
    ml_engine = MLTrafficPredictionEngine(models_dir=models_dir)
    
    router = GraphRoutingEngine(road_network_data=network, ml_engine=ml_engine)
    
    routes = router.compute_route_paths(
        origin_lat=28.6139,
        origin_lng=77.2090,
        dest_lat=28.6350,
        dest_lng=77.2250
    )
    
    assert len(routes) == 3
    ai_route = routes[0]
    assert ai_route["route_type"] == "OPTIMAL_AI"
    assert len(ai_route["coordinates"]) >= 2
    assert ai_route["distance_km"] > 0
    assert ai_route["estimated_time_min"] > 0

def test_api_endpoints():
    with TestClient(app) as client:
        # 1. Health check
        res_health = client.get("/health")
        assert res_health.status_code == 200
        assert res_health.json()["status"] == "healthy"

        # 2. Hospital recommendation API
        res_hosp = client.get("/api/v1/hospitals/recommend?lat=28.6139&lng=77.2090&condition=CARDIAC_ARREST")
        assert res_hosp.status_code == 200
        data_hosp = res_hosp.json()
        assert len(data_hosp) > 0
        assert data_hosp[0]["is_recommended"] is True

        # 3. Route calculation API
        res_route = client.post("/api/v1/routing/calculate", json={
            "origin_lat": 28.6139,
            "origin_lng": 77.2090,
            "destination_lat": 28.6350,
            "destination_lng": 77.2250,
            "weather": "CLEAR"
        })
        assert res_route.status_code == 200
        data_routes = res_route.json()
        assert len(data_routes) == 3

        # 4. Emergency initiate API
        res_emerg = client.post("/api/v1/emergency/initiate", json={
            "ambulance_id": "AMB_TEST_01",
            "origin_lat": 28.6139,
            "origin_lng": 77.2090,
            "patient_condition": "CARDIAC_ARREST",
            "severity": "CRITICAL"
        })
        assert res_emerg.status_code == 200
        data_emerg = res_emerg.json()
        assert "trip_id" in data_emerg
        assert data_emerg["status"] == "ACTIVE_EMERGENCY"
        assert "recommended_route" in data_emerg

        # 5. Traffic Signals API
        res_signals = client.get("/api/v1/signals")
        assert res_signals.status_code == 200
        assert len(res_signals.json()) > 0

        # 6. Analytics API
        res_analytics = client.get("/api/v1/analytics/summary")
        assert res_analytics.status_code == 200
        assert "average_time_saved_minutes" in res_analytics.json()
