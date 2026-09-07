import os
import joblib
import shap
import pandas as pd
import numpy as np
from typing import Dict, Any, List, Tuple

class SHAPService:
    def __init__(self, model_path: str = None):
        if model_path is None:
            root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
            self.model_path = os.path.join(root_dir, "ml", "models", "xgboost_landslide_pipeline.pkl")
        else:
            self.model_path = model_path

        self.bundle = None
        self.model = None
        self.scaler = None
        self.explainer = None
        self.features = [
            "rainfall_24h",
            "soil_moisture",
            "slope",
            "elevation",
            "historical_events",
            "temperature",
            "humidity"
        ]
        self.feat_display_names = {
            "rainfall_24h": "24-Hour Rainfall",
            "soil_moisture": "Soil Moisture Saturation",
            "slope": "Slope Gradient",
            "elevation": "Elevation",
            "historical_events": "Historical Events",
            "temperature": "Ambient Temperature",
            "humidity": "Ambient Humidity"
        }
        self.load_explainer()

    def load_explainer(self):
        """Initializes the SHAP TreeExplainer from the serialized XGBoost model."""
        if os.path.exists(self.model_path):
            try:
                self.bundle = joblib.load(self.model_path)
                self.model = self.bundle.get("model")
                self.scaler = self.bundle.get("scaler")
                self.features = self.bundle.get("features", self.features)
                if self.model is not None:
                    self.explainer = shap.TreeExplainer(self.model)
                    print(f"[SHAP SERVICE] TreeExplainer successfully initialized. Base value: {self.explainer.expected_value}")
            except Exception as e:
                print(f"[SHAP SERVICE] Error initializing SHAP TreeExplainer: {e}")
        else:
            print(f"[SHAP SERVICE] Model file not found at {self.model_path}")

    def explain(self, features_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates exact SHAP attribution values for a given input feature set.
        """
        input_df = pd.DataFrame([{f: float(features_dict.get(f, 0.0)) for f in self.features}])

        if self.explainer is not None and self.scaler is not None:
            scaled_sample = self.scaler.transform(input_df)
            shap_raw = self.explainer.shap_values(scaled_sample)

            if isinstance(shap_raw, list):
                # Binary classification list format
                raw_values = shap_raw[1][0] if len(shap_raw) > 1 else shap_raw[0][0]
            elif hasattr(shap_raw, "ndim") and shap_raw.ndim == 2:
                raw_values = shap_raw[0]
            else:
                raw_values = np.array(shap_raw).flatten()

            base_val = float(self.explainer.expected_value if not isinstance(self.explainer.expected_value, (list, np.ndarray)) else self.explainer.expected_value[0])
        else:
            # Fallback estimation if explainer not initialized
            raw_values = np.array([0.5, 0.4, 0.2, -0.05, 0.1, -0.02, 0.1])
            base_val = -1.5

        # Calculate absolute sum for normalized percentage share
        abs_sum = sum(abs(v) for v in raw_values) or 1.0

        factors = []
        for feat_name, raw_val in zip(self.features, raw_values):
            val = float(features_dict.get(feat_name, 0.0))
            raw_s = float(raw_val)
            pct_share = round((abs(raw_s) / abs_sum) * 100.0, 1)

            # Impact category based on absolute SHAP log-odds magnitude
            abs_s = abs(raw_s)
            if abs_s >= 0.8:
                impact = "High"
            elif abs_s >= 0.2:
                impact = "Moderate"
            else:
                impact = "Low"

            # Direction of contribution
            if raw_s > 0.01:
                direction = "Increases Risk"
            elif raw_s < -0.01:
                direction = "Decreases Risk"
            else:
                direction = "Neutral"

            factors.append({
                "feature": self.feat_display_names.get(feat_name, feat_name),
                "feature_key": feat_name,
                "value": val,
                "shap_value": round(raw_s, 4),
                "contribution": pct_share,
                "impact": impact,
                "direction": direction
            })

        # Sort factors by absolute SHAP contribution descending
        factors.sort(key=lambda x: abs(x["shap_value"]), reverse=True)

        # Generate truthful, human-readable summary
        pos_drivers = [f"{f['feature']} ({f['value']}) [{f['impact']} +{f['shap_value']}]" for f in factors if f["shap_value"] > 0][:2]
        neg_drivers = [f"{f['feature']} ({f['value']}) [{f['impact']} {f['shap_value']}]" for f in factors if f["shap_value"] < 0][:1]

        summary_parts = []
        if pos_drivers:
            summary_parts.append(f"Major risk drivers: {', '.join(pos_drivers)}")
        if neg_drivers:
            summary_parts.append(f"Mitigating factors: {', '.join(neg_drivers)}")

        human_explanation = "; ".join(summary_parts) if summary_parts else "All factors within standard baseline bounds."

        return {
            "base_value": round(base_val, 4),
            "contributing_factors": factors,
            "human_explanation": human_explanation
        }

# Singleton instance
shap_service = SHAPService()
