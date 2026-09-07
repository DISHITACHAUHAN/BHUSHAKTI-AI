import os
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone

class MLService:
    def __init__(self, model_path: str = None):
        if model_path is None:
            # Default model path relative to project
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            self.model_path = os.path.join(root_dir, "ml", "models", "xgboost_landslide_pipeline.pkl")
        else:
            self.model_path = model_path

        self.bundle = None
        self.model = None
        self.scaler = None
        self.features = [
            "rainfall_24h",
            "soil_moisture",
            "slope",
            "elevation",
            "historical_events",
            "temperature",
            "humidity"
        ]
        self.load_model()

    def load_model(self):
        """Loads the trained XGBoost pipeline bundle."""
        if os.path.exists(self.model_path):
            try:
                self.bundle = joblib.load(self.model_path)
                self.model = self.bundle.get("model")
                self.scaler = self.bundle.get("scaler")
                self.features = self.bundle.get("features", self.features)
                print(f"[ML SERVICE] Successfully loaded XGBoost pipeline from: {self.model_path}")
            except Exception as e:
                print(f"[ML SERVICE] Error loading model: {e}. Falling back to physics formula.")
        else:
            print(f"[ML SERVICE] Model file not found at {self.model_path}. Will use calibrated geotechnical fallback.")

    def predict_risk(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes landslide probability and contributing factors from raw inputs.
        """
        input_df = pd.DataFrame([{f: features_dict.get(f, 0.0) for f in self.features}])

        if self.model is not None and self.scaler is not None:
            scaled_input = self.scaler.transform(input_df)
            prob_raw = float(self.model.predict_proba(scaled_input)[0, 1])
        else:
            # Calibrated fallback if model artifact not present
            r = min(1.0, features_dict.get("rainfall_24h", 0) / 120.0)
            s = features_dict.get("soil_moisture", 0) / 100.0
            sl = min(1.0, features_dict.get("slope", 0) / 60.0)
            h = min(1.0, features_dict.get("historical_events", 0) / 15.0)
            prob_raw = 0.35 * r + 0.30 * s + 0.20 * sl + 0.15 * h

        risk_prob = round(float(np.clip(prob_raw, 0.01, 0.99)), 4)
        risk_pct = round(risk_prob * 100.0, 2)

        # Categorical classification thresholds
        if risk_pct >= 75.0:
            category = "CRITICAL"
            rec_action = "Issue RED ALERT. Immediate evacuation of vulnerable downslope habitations and closure of adjacent mountain highway corridors."
        elif risk_pct >= 50.0:
            category = "HIGH"
            rec_action = "Issue ORANGE WARNING. Restrict heavy transit on mountain corridors, deploy SDRF patrol teams, and stage emergency relief camps."
        elif risk_pct >= 25.0:
            category = "MODERATE"
            rec_action = "Issue YELLOW ADVISORY. Continuous telemetry monitoring of pore pressure and road cutting toe slopes."
        else:
            category = "LOW"
            rec_action = "Routine geological monitoring. All mountain corridors operational."

        # Compute factor contributions based on feature importances and input levels
        importances = self.bundle.get("feature_importances", {}) if self.bundle else {}
        contributing_factors = []

        feat_display_names = {
            "rainfall_24h": "24-Hour Rainfall",
            "soil_moisture": "Soil Moisture Saturation",
            "slope": "Slope Gradient",
            "elevation": "Elevation",
            "historical_events": "Historical Events",
            "temperature": "Ambient Temperature",
            "humidity": "Ambient Humidity"
        }

        for feat in self.features:
            val = float(features_dict.get(feat, 0.0))
            weight = importances.get(feat, 0.14)

            # Normalized signal
            if feat == "rainfall_24h":
                norm = min(1.0, val / 150.0)
            elif feat in ["soil_moisture", "humidity"]:
                norm = min(1.0, val / 100.0)
            elif feat == "slope":
                norm = min(1.0, val / 65.0)
            elif feat == "historical_events":
                norm = min(1.0, val / 20.0)
            else:
                norm = 0.3

            contrib_pct = round(weight * norm * 100.0 * (risk_prob + 0.2), 1)

            if norm > 0.6:
                impact = "High"
                direction = "Increases Risk"
            elif norm > 0.3:
                impact = "Moderate"
                direction = "Increases Risk"
            else:
                impact = "Low"
                direction = "Neutral"

            contributing_factors.append({
                "feature": feat_display_names.get(feat, feat),
                "value": val,
                "contribution": contrib_pct,
                "impact": impact,
                "direction": direction
            })

        contributing_factors.sort(key=lambda x: x["contribution"], reverse=True)

        top_factors = [f"{f['feature']} ({f['value']})" for f in contributing_factors[:2]]
        summary = f"Risk is classified as {category} ({risk_pct}%) driven primarily by {' and '.join(top_factors)}."

        return {
            "risk_probability": risk_prob,
            "risk_percentage": risk_pct,
            "risk_category": category,
            "contributing_factors": contributing_factors,
            "model_version": self.bundle.get("version", "xgboost_v1.0") if self.bundle else "calibrated_baseline_v1",
            "explanation_summary": summary,
            "recommended_action": rec_action,
            "timestamp": datetime.now(timezone.utc)
        }

# Singleton instance
ml_service = MLService()
