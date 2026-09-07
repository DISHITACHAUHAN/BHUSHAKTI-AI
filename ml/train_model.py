import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
import xgboost as xgb

FEATURES = [
    "rainfall_24h",
    "soil_moisture",
    "slope",
    "elevation",
    "historical_events",
    "temperature",
    "humidity"
]

TARGET = "landslide_occurred"

def train_xgboost_pipeline(data_path: str, model_save_dir: str):
    """
    Trains, evaluates, and serializes the XGBoost landslide risk prediction model.
    """
    print(f"[ML PIPELINE] Loading dataset from: {data_path}")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    df = pd.read_csv(data_path)
    print(f"[ML PIPELINE] Dataset loaded with {df.shape[0]} rows and {df.shape[1]} columns.")

    X = df[FEATURES]
    y = df[TARGET]

    print(f"[ML PIPELINE] Target distribution:\n{y.value_counts(normalize=True).round(4)}")

    # Train / Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"[ML PIPELINE] Training set: {X_train.shape[0]} samples, Test set: {X_test.shape[0]} samples.")

    # Preprocessing: StandardScaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Initialize XGBoost Classifier
    model = xgb.XGBClassifier(
        n_estimators=250,
        max_depth=5,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85,
        min_child_weight=2,
        gamma=0.1,
        random_state=42,
        eval_metric="logloss"
    )

    print("[ML PIPELINE] Training XGBoost model...")
    model.fit(
        X_train_scaled,
        y_train,
        eval_set=[(X_train_scaled, y_train), (X_test_scaled, y_test)],
        verbose=False
    )

    # Evaluation on Test Split
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    auc = float(roc_auc_score(y_test, y_proba))
    cm = confusion_matrix(y_test, y_pred).tolist()
    clf_report = classification_report(y_test, y_pred, output_dict=True)

    print("\n=================== ACTUAL EVALUATION RESULTS ===================")
    print(f"Accuracy:  {acc:.4f} ({acc*100:.2f}%)")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")
    print(f"ROC-AUC:   {auc:.4f}")
    print("\nConfusion Matrix [ [TN, FP], [FN, TP] ]:")
    print(np.array(cm))
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, digits=4))
    print("=================================================================\n")

    # Feature Importances (Gain & Weight)
    feature_importances = dict(zip(FEATURES, [float(v) for v in model.feature_importances_]))
    sorted_importances = dict(sorted(feature_importances.items(), key=lambda x: x[1], reverse=True))
    print(f"[ML PIPELINE] Feature Importances: {sorted_importances}")

    # Save Pipeline Bundle
    os.makedirs(model_save_dir, exist_ok=True)
    bundle_path = os.path.join(model_save_dir, "xgboost_landslide_pipeline.pkl")
    metrics_path = os.path.join(model_save_dir, "evaluation_metrics.json")

    pipeline_bundle = {
        "model": model,
        "scaler": scaler,
        "features": FEATURES,
        "target": TARGET,
        "metrics": {
            "accuracy": acc,
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "roc_auc": auc,
            "confusion_matrix": cm
        },
        "feature_importances": sorted_importances,
        "version": "xgboost_v1.0"
    }

    joblib.dump(pipeline_bundle, bundle_path)
    print(f"[ML PIPELINE] Saved pipeline bundle to: {bundle_path}")

    with open(metrics_path, "w") as f:
        json.dump({
            "metrics": pipeline_bundle["metrics"],
            "feature_importances": sorted_importances,
            "classification_report": clf_report
        }, f, indent=2)
    print(f"[ML PIPELINE] Saved evaluation metrics to: {metrics_path}")

    return pipeline_bundle

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(base_dir, "data", "historical_landslide_dataset.csv")
    models_dir = os.path.join(base_dir, "models")
    train_xgboost_pipeline(data_file, models_dir)
