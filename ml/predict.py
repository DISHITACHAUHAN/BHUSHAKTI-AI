import os
import joblib
import pandas as pd
import numpy as np

def predict_sample(sample_dict: dict, model_path: str = None):
    """
    Inference helper for a single observation dict.
    """
    if model_path is None:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(base_dir, "models", "xgboost_landslide_pipeline.pkl")

    bundle = joblib.load(model_path)
    model = bundle["model"]
    scaler = bundle["scaler"]
    features = bundle["features"]

    df_sample = pd.DataFrame([sample_dict])[features]
    scaled = scaler.transform(df_sample)
    proba = float(model.predict_proba(scaled)[0, 1])
    pct = round(proba * 100, 2)

    if pct >= 75.0:
        cat = "CRITICAL"
    elif pct >= 50.0:
        cat = "HIGH"
    elif pct >= 25.0:
        cat = "MODERATE"
    else:
        cat = "LOW"

    return {
        "risk_probability": round(proba, 4),
        "risk_percentage": pct,
        "risk_category": cat,
        "model_version": bundle.get("version", "xgboost_v1.0")
    }

if __name__ == "__main__":
    test_input = {
        "rainfall_24h": 95.0,
        "soil_moisture": 88.0,
        "slope": 52.0,
        "elevation": 2100.0,
        "historical_events": 16,
        "temperature": 16.0,
        "humidity": 94.0
    }
    result = predict_sample(test_input)
    print("Standalone Prediction Test Output:")
    print(result)
