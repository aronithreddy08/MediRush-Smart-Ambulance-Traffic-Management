import os
import json
import math
import numpy as np
import pandas as pd

def generate_traffic_dataset(output_path: str = "traffic_dataset.csv", num_samples: int = 50000):
    np.random.seed(42)

    # Road types & base parameters
    road_types = ["EXPRESSWAY", "ARTERIAL", "LOCAL"]
    road_ids = [f"E{i:02d}" for i in range(1, 16)]
    weathers = ["CLEAR", "RAIN", "FOG"]

    records = []
    
    # 24 hours x 7 days patterns
    for _ in range(num_samples):
        road_id = np.random.choice(road_ids)
        road_type = "EXPRESSWAY" if road_id in ["E03", "E07", "E08", "E13"] else ("LOCAL" if road_id in ["E05", "E11"] else "ARTERIAL")
        
        # Base free-flow speed based on road type
        if road_type == "EXPRESSWAY":
            free_flow_speed = 60.0 + np.random.uniform(-3, 5)
            capacity = 120  # vehicles/km
        elif road_type == "ARTERIAL":
            free_flow_speed = 45.0 + np.random.uniform(-3, 3)
            capacity = 80
        else:
            free_flow_speed = 35.0 + np.random.uniform(-2, 2)
            capacity = 50

        hour = np.random.randint(0, 24)
        minute = np.random.randint(0, 60)
        time_decimal = hour + minute / 60.0
        day_of_week = np.random.randint(0, 7)  # 0: Monday, 6: Sunday
        is_weekend = 1 if day_of_week >= 5 else 0

        # Rush hour multipliers
        # Morning peak: 8:30 - 10:30 (peak at 9.0)
        # Evening peak: 17:00 - 19:30 (peak at 18.0)
        morning_rush = np.exp(-((time_decimal - 9.0) ** 2) / 2.5) if not is_weekend else 0.2 * np.exp(-((time_decimal - 11.0) ** 2) / 4.0)
        evening_rush = np.exp(-((time_decimal - 18.0) ** 2) / 3.0) if not is_weekend else 0.4 * np.exp(-((time_decimal - 17.5) ** 2) / 4.0)
        rush_intensity = max(morning_rush, evening_rush)

        weather = np.random.choice(weathers, p=[0.75, 0.18, 0.07])
        weather_factor = 1.0 if weather == "CLEAR" else (0.78 if weather == "RAIN" else 0.65)

        # Vehicle density calculation (Greenshields traffic flow relation)
        base_density = capacity * (0.15 + 0.70 * rush_intensity)
        noise = np.random.normal(0, 0.08 * capacity)
        density = max(5, min(capacity * 1.1, base_density + noise))

        # Speed calculation (Speed = FreeFlow * (1 - Density/Capacity) * WeatherFactor)
        speed_ratio = max(0.12, 1.0 - (density / (capacity * 1.05)))
        actual_speed = free_flow_speed * speed_ratio * weather_factor + np.random.normal(0, 1.5)
        actual_speed = max(5.0, min(free_flow_speed * 1.05, actual_speed))

        # Congestion categorization
        congestion_index = 1.0 - (actual_speed / free_flow_speed)
        congestion_index = max(0.0, min(1.0, congestion_index))

        if congestion_index < 0.25:
            congestion_class = 0  # FREE_FLOW
        elif congestion_index < 0.50:
            congestion_class = 1  # MODERATE
        elif congestion_index < 0.75:
            congestion_class = 2  # HEAVY
        else:
            congestion_class = 3  # GRIDLOCK

        # Cyclic time features
        hour_sin = math.sin(2 * math.pi * time_decimal / 24.0)
        hour_cos = math.cos(2 * math.pi * time_decimal / 24.0)
        day_sin = math.sin(2 * math.pi * day_of_week / 7.0)
        day_cos = math.cos(2 * math.pi * day_of_week / 7.0)

        # Historical 15-min rolling speed proxy
        historical_speed = actual_speed + np.random.normal(0, 2.0)

        records.append({
            "road_id": road_id,
            "road_type": road_type,
            "hour": hour,
            "minute": minute,
            "day_of_week": day_of_week,
            "is_weekend": is_weekend,
            "hour_sin": hour_sin,
            "hour_cos": hour_cos,
            "day_sin": day_sin,
            "day_cos": day_cos,
            "weather": weather,
            "free_flow_speed": round(free_flow_speed, 2),
            "vehicle_density": round(density, 1),
            "historical_speed": round(historical_speed, 2),
            "actual_speed": round(actual_speed, 2),
            "congestion_index": round(congestion_index, 3),
            "congestion_class": congestion_class
        })

    df = pd.DataFrame(records)
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} samples saved to {output_path}")
    return df

if __name__ == "__main__":
    generate_traffic_dataset()
