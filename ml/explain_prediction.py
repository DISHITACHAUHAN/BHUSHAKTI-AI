import os
import joblib
import shap
import pandas as pd
import numpy as np

def test_shap_explainer():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(base_dir, "models", "xgboost_landslide_pipeline.pkl")

    bundle = joblib.load(model_path)
    model = bundle["model"]
    scaler = bundle["scaler"]
    features = bundle["features"]

    explainer = shap.TreeExplainer(model)
    print(f"[SHAP TEST] TreeExplainer initialized successfully. Expected value (base log-odds): {explainer.expected_value}")

    # Test sample
    sample = pd.DataFrame([{
        "rainfall_24h": 95.0,
        "soil_moisture": 82.0,
        "slope": 48.0,
        "elevation": 1950.0,
        "historical_events": 14,
        "temperature": 18.0,
        "humidity": 92.0
    }])[features]

    scaled_sample = scaler.transform(sample)
    shap_vals = explainer.shap_values(scaled_sample)[0]

    print("\n[SHAP TEST] Calculated SHAP values for test sample:")
    for feat, s_val in zip(features, shap_vals):
        direction = "Increases Risk (+)" if s_val > 0 else "Decreases Risk (-)"
        print(f"  {feat:<20}: {s_val:+.4f} | {direction}")

if __name__ == "__main__":
    test_shap_explainer()
