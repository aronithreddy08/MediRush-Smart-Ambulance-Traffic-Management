import os
import math
import json
import logging
from typing import Dict, List, Any, Optional
import pandas as pd
import numpy as np
import joblib

logger = logging.getLogger("medirush.ml_engine")

class MLTrafficPredictionEngine:
    def __init__(self, models_dir: Optional[str] = None):
        if not models_dir:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            models_dir = os.path.abspath(os.path.join(base_dir, "..", "..", "ml", "models"))
        
        self.models_dir = models_dir
        self.speed_pipeline = None
        self.classifier = None
        self.preprocessor = None
        self.model_metrics = {}
        
        # Real-time simulated dynamic traffic perturbations: { road_id: { "speed_factor": float, "incident": str } }
        self.active_perturbations: Dict[str, Dict[str, Any]] = {}

        self.load_models()

    def load_models(self):
        try:
            speed_path = os.path.join(self.models_dir, "speed_predictor_pipeline.joblib")
            class_path = os.path.join(self.models_dir, "congestion_classifier.joblib")
            prep_path = os.path.join(self.models_dir, "traffic_preprocessor.joblib")
            metrics_path = os.path.join(self.models_dir, "model_metrics.json")

            if os.path.exists(speed_path):
                self.speed_pipeline = joblib.load(speed_path)
                logger.info("Loaded speed prediction pipeline.")
            if os.path.exists(class_path):
                self.classifier = joblib.load(class_path)
                logger.info("Loaded congestion classifier.")
            if os.path.exists(prep_path):
                self.preprocessor = joblib.load(prep_path)
                logger.info("Loaded traffic preprocessor.")
            if os.path.exists(metrics_path):
                with open(metrics_path, "r") as f:
                    self.model_metrics = json.load(f)
        except Exception as e:
            logger.error(f"Error loading ML models: {e}. Utilizing fallback heuristics.")

    def inject_incident(self, road_id: str, speed_multiplier: float = 0.20, incident_label: str = "Severe Congestion / Bottleneck"):
        """Simulates unexpected congestion spike or obstruction for demoing dynamic rerouting."""
        self.active_perturbations[road_id] = {
            "speed_factor": speed_multiplier,
            "incident": incident_label
        }
        logger.info(f"Traffic incident injected on {road_id}: {incident_label} (factor: {speed_multiplier})")

    def clear_incidents(self):
        self.active_perturbations.clear()
        logger.info("Cleared all injected traffic incidents.")

    def predict_segments(
        self,
        road_segments: List[Dict[str, Any]],
        hour_of_day: Optional[int] = None,
        day_of_week: Optional[int] = None,
        weather: str = "CLEAR"
    ) -> List[Dict[str, Any]]:
        """
        Batch-predicts speed, congestion class, and risk score for given road segments.
        """
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        hour = hour_of_day if hour_of_day is not None else now.hour
        minute = now.minute
        time_decimal = hour + minute / 60.0
        dow = day_of_week if day_of_week is not None else now.weekday()
        is_weekend = 1 if dow >= 5 else 0

        hour_sin = math.sin(2 * math.pi * time_decimal / 24.0)
        hour_cos = math.cos(2 * math.pi * time_decimal / 24.0)
        day_sin = math.sin(2 * math.pi * dow / 7.0)
        day_cos = math.cos(2 * math.pi * dow / 7.0)

        records = []
        for r in road_segments:
            road_id = r.get("id") or r.get("road_id", "E01")
            road_type = r.get("road_type", "ARTERIAL")
            free_flow = float(r.get("speed_limit_kmh", 45.0))
            
            # Historical speed base
            hist_speed = free_flow * 0.85

            records.append({
                "road_id": road_id,
                "road_type": road_type,
                "hour_sin": hour_sin,
                "hour_cos": hour_cos,
                "day_sin": day_sin,
                "day_cos": day_cos,
                "is_weekend": is_weekend,
                "weather": weather,
                "free_flow_speed": free_flow,
                "vehicle_density": 35.0,
                "historical_speed": hist_speed
            })

        df = pd.DataFrame(records)
        predictions = []

        if self.speed_pipeline is not None and self.preprocessor is not None:
            try:
                preds_speed = self.speed_pipeline.predict(df)
                trans_X = self.preprocessor.transform(df)
                probs = self.classifier.predict_proba(trans_X)
            except Exception as ex:
                logger.warning(f"Inference exception: {ex}. Using heuristic fallback.")
                preds_speed = [r["free_flow_speed"] * 0.75 for r in records]
                probs = [[0.6, 0.3, 0.1, 0.0] for _ in records]
        else:
            preds_speed = [r["free_flow_speed"] * 0.75 for r in records]
            probs = [[0.6, 0.3, 0.1, 0.0] for _ in records]

        class_labels = ["FREE_FLOW", "MODERATE", "HEAVY", "GRIDLOCK"]

        for idx, r in enumerate(road_segments):
            road_id = r.get("id") or r.get("road_id", "E01")
            road_name = r.get("name", f"Road {road_id}")
            free_flow = float(r.get("speed_limit_kmh", 45.0))
            
            raw_speed = float(preds_speed[idx])

            # Apply active live incident perturbations if any
            incident_note = None
            if road_id in self.active_perturbations:
                perturb = self.active_perturbations[road_id]
                raw_speed = max(4.0, raw_speed * perturb["speed_factor"])
                incident_note = perturb["incident"]

            pred_speed = round(raw_speed, 1)
            prob_dist = probs[idx]
            top_class_idx = int(np.argmax(prob_dist))
            congestion_label = class_labels[top_class_idx]
            
            if road_id in self.active_perturbations:
                congestion_label = "GRIDLOCK"
                congestion_prob = 0.95
            else:
                congestion_prob = round(float(1.0 - (pred_speed / free_flow)), 2)
                congestion_prob = max(0.05, min(0.98, congestion_prob))

            risk_score = round(float(np.sum([prob_dist[i] * i for i in range(len(prob_dist))]) / 3.0), 2)
            if road_id in self.active_perturbations:
                risk_score = 0.98

            predictions.append({
                "road_id": road_id,
                "road_name": road_name,
                "predicted_speed_kmh": pred_speed,
                "free_flow_speed_kmh": free_flow,
                "congestion_probability": congestion_prob,
                "congestion_level": congestion_label,
                "risk_score": risk_score,
                "active_incident": incident_note
            })

        return predictions
