import os
import json
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

def evaluate_saved_model(data_path: str, model_path: str):
    """
    Evaluates the saved XGBoost pipeline against the test dataset split.
    """
    print(f"[EVALUATION] Loading pipeline bundle from: {model_path}")
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}")

    bundle = joblib.load(model_path)
    model = bundle["model"]
    scaler = bundle["scaler"]
    features = bundle["features"]
    target = bundle["target"]

    print(f"[EVALUATION] Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)

    # Use test split identical to training (random_state=42, test_size=0.20)
    from sklearn.model_selection import train_test_split
    _, X_test, _, y_test = train_test_split(
        df[features], df[target], test_size=0.20, random_state=42, stratify=df[target]
    )

    X_test_scaled = scaler.transform(X_test)
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred)

    print("\n========================================================")
    print("      BHUSHAKTI AI — XGBOOST MODEL EVALUATION REPORT     ")
    print("========================================================")
    print(f"Total Test Samples:        {len(y_test)}")
    print(f"Landslide Positive Cases:  {int(sum(y_test))} ({sum(y_test)/len(y_test)*100:.1f}%)")
    print(f"Non-Event Negative Cases:  {int(len(y_test) - sum(y_test))} ({(len(y_test) - sum(y_test))/len(y_test)*100:.1f}%)")
    print("--------------------------------------------------------")
    print(f"Accuracy:                  {acc:.4f} ({acc*100:.2f}%)")
    print(f"Precision (PPV):           {prec:.4f} ({prec*100:.2f}%)")
    print(f"Recall (Sensitivity):      {rec:.4f} ({rec*100:.2f}%)")
    print(f"F1-Score:                  {f1:.4f}")
    print(f"ROC-AUC Score:             {auc:.4f}")
    print("--------------------------------------------------------")
    print("Confusion Matrix:")
    print(f"  True Negatives (TN):   {cm[0, 0]}")
    print(f"  False Positives (FP):  {cm[0, 1]}")
    print(f"  False Negatives (FN):  {cm[1, 0]}")
    print(f"  True Positives (TP):   {cm[1, 1]}")
    print("--------------------------------------------------------")
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Safe/Moderate (0)", "Landslide Trigger (1)"], digits=4))
    print("--------------------------------------------------------")
    print("Feature Importances:")
    for feat, imp in bundle.get("feature_importances", {}).items():
        bar = "#" * int(imp * 40)
        print(f"  {feat:<20} {imp:.4f} | {bar}")
    print("========================================================\n")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(base_dir, "data", "historical_landslide_dataset.csv")
    model_file = os.path.join(base_dir, "models", "xgboost_landslide_pipeline.pkl")
    evaluate_saved_model(data_file, model_file)
