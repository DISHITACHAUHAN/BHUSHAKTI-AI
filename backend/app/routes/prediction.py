from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from backend.app.database.session import get_db
from backend.app.schemas.prediction import PredictRequest, PredictResponse, ContributingFactor
from backend.app.models.prediction import PredictionRecord
from backend.app.services.ml_service import ml_service
from backend.app.services.shap_service import shap_service

router = APIRouter(prefix="/api", tags=["AI Prediction"])

@router.post("/predict", response_model=PredictResponse)
def predict_landslide_risk(payload: PredictRequest, db: Session = Depends(get_db)):
    """
    POST /api/predict
    Computes landslide risk probability using trained XGBoost and calculates
    exact feature attributions and base expected value via TreeSHAP.
    """
    input_dict = payload.model_dump()

    # 1. XGBoost Inference
    ml_result = ml_service.predict_risk(input_dict)

    # 2. Exact TreeSHAP Calculation
    shap_result = shap_service.explain(input_dict)

    factors_dto = [
        ContributingFactor(
            feature=f["feature"],
            feature_key=f["feature_key"],
            value=f["value"],
            shap_value=f["shap_value"],
            contribution=f["contribution"],
            impact=f["impact"],
            direction=f["direction"]
        )
        for f in shap_result["contributing_factors"]
    ]

    # Combined explainable summary
    summary = f"Risk: {ml_result['risk_percentage']}% ({ml_result['risk_category']}). {shap_result['human_explanation']}"

    # Persist prediction and SHAP attributions in database
    try:
        record = PredictionRecord(
            location_id=payload.location_id,
            risk_probability=ml_result["risk_probability"],
            risk_category=ml_result["risk_category"],
            input_features=input_dict,
            shap_values={
                "base_value": shap_result["base_value"],
                "factors": [f.model_dump() for f in factors_dto]
            },
            contributing_factors=[f.model_dump() for f in factors_dto],
            model_version=ml_result["model_version"],
            timestamp=datetime.now(timezone.utc)
        )
        db.add(record)
        db.commit()
    except Exception:
        db.rollback()

    return PredictResponse(
        risk_probability=ml_result["risk_probability"],
        risk_percentage=ml_result["risk_percentage"],
        risk_category=ml_result["risk_category"],
        contributing_factors=factors_dto,
        shap_base_value=shap_result["base_value"],
        model_version=ml_result["model_version"],
        explanation_summary=summary,
        recommended_action=ml_result["recommended_action"],
        timestamp=datetime.now(timezone.utc)
    )
