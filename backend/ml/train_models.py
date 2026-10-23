import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingClassifier
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error, classification_report

from dataset_generator import generate_traffic_dataset

def train_and_export_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    csv_path = os.path.join(base_dir, "traffic_dataset.csv")
    if not os.path.exists(csv_path):
        print("Generating dataset...")
        df = generate_traffic_dataset(output_path=csv_path, num_samples=30000)
    else:
        df = pd.read_csv(csv_path)

    # Feature definitions
    categorical_features = ["road_id", "road_type", "weather"]
    numeric_features = ["hour_sin", "hour_cos", "day_sin", "day_cos", "is_weekend", "free_flow_speed", "vehicle_density", "historical_speed"]

    X = df[categorical_features + numeric_features]
    y_speed = df["actual_speed"]
    y_class = df["congestion_class"]

    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", StandardScaler(), numeric_features)
        ]
    )

    # Train/Test Split
    X_train, X_test, y_speed_train, y_speed_test, y_class_train, y_class_test = train_test_split(
        X, y_speed, y_class, test_size=0.2, random_state=42
    )

    print("Training Speed Prediction Model (Random Forest Regressor)...")
    speed_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", RandomForestRegressor(n_estimators=100, max_depth=14, n_jobs=-1, random_state=42))
    ])
    speed_pipeline.fit(X_train, y_speed_train)

    speed_preds = speed_pipeline.predict(X_test)
    r2 = r2_score(y_speed_test, speed_preds)
    mae = mean_absolute_error(y_speed_test, speed_preds)
    rmse = np.sqrt(mean_squared_error(y_speed_test, speed_preds))

    print(f"Speed Regressor Metrics -> R2: {r2:.4f}, MAE: {mae:.2f} km/h, RMSE: {rmse:.2f} km/h")

    print("Training Congestion State Classifier (Gradient Boosting)...")
    # For classifier, use dense preprocessed data
    X_train_trans = preprocessor.fit_transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    classifier = HistGradientBoostingClassifier(max_iter=120, learning_rate=0.08, random_state=42)
    classifier.fit(X_train_trans, y_class_train)

    class_preds = classifier.predict(X_test_trans)
    class_report = classification_report(y_class_test, class_preds, target_names=["FREE_FLOW", "MODERATE", "HEAVY", "GRIDLOCK"], output_dict=True)

    # Save Pipeline & Models
    joblib.dump(speed_pipeline, os.path.join(models_dir, "speed_predictor_pipeline.joblib"))
    joblib.dump(classifier, os.path.join(models_dir, "congestion_classifier.joblib"))
    joblib.dump(preprocessor, os.path.join(models_dir, "traffic_preprocessor.joblib"))

    # Save metadata & evaluation benchmarks
    metrics = {
        "model_version": "1.0.0",
        "speed_regressor": {
            "algorithm": "RandomForestRegressor(n_estimators=100, max_depth=14)",
            "r2_score": round(float(r2), 4),
            "mae_kmh": round(float(mae), 2),
            "rmse_kmh": round(float(rmse), 2)
        },
        "congestion_classifier": {
            "algorithm": "HistGradientBoostingClassifier(max_iter=120)",
            "accuracy": round(float(class_report["accuracy"]), 4),
            "macro_f1": round(float(class_report["macro avg"]["f1-score"]), 4)
        },
        "dataset_samples": len(df)
    }

    with open(os.path.join(models_dir, "model_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"All ML models & benchmark metrics saved successfully to {models_dir}")
    return metrics

if __name__ == "__main__":
    train_and_export_models()
