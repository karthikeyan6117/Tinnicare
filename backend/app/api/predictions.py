import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.health_record import SymptomRecord
from app.models.prediction import PredictionLog
from app.schemas.prediction import PredictionInput, PredictionResponse
from app.schemas.tinnitus_profile import (
    SoundTherapy,
    TinnitusProfileInput,
    TinnitusProfileResponse,
)
from app.services.prediction_service import risk_predictor
from app.services.ai_service import ai_service
from app.services.tinnitus_profile_service import tinnitus_profile_predictor

router = APIRouter(prefix="/predictions", tags=["Predictions"])


@router.post("", response_model=PredictionResponse)
def predict_risk(
    input_data: PredictionInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = risk_predictor.predict(input_data)

    prediction = PredictionLog(
        patient_id=current_user.id,
        predicted_risk=result["predicted_risk"],
        predicted_severity_score=result["predicted_severity_score"],
        flare_up_probability=result["flare_up_probability"],
        model_used=result.get("model_version", "random_forest_v1"),
        input_features=json.dumps(input_data.model_dump()),
    )
    db.add(prediction)
    db.commit()

    return PredictionResponse(
        patient_id=current_user.id,
        predicted_risk=result["predicted_risk"],
        predicted_severity_score=result["predicted_severity_score"],
        flare_up_probability=result["flare_up_probability"],
        recommendation=result["recommendation"],
        prediction_date=prediction.prediction_date,
    )


@router.post("/ai-insights")
def get_ai_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    symptoms = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.patient_id == current_user.id)
        .order_by(SymptomRecord.recorded_at.desc())
        .limit(50)
        .all()
    )

    if not symptoms:
        raise HTTPException(status_code=404, detail="No symptom data available for analysis")

    symptom_data = [
        {
            "severity": s.severity.value,
            "loudness": s.loudness_level,
            "duration": s.duration_minutes,
            "stress": s.stress_level,
            "sleep": s.sleep_quality,
            "date": s.recorded_at.isoformat(),
        }
        for s in symptoms
    ]

    analysis = ai_service.analyze_symptom_pattern(symptom_data)
    return {"analysis": analysis}


@router.post("/tinnitus-profile", response_model=TinnitusProfileResponse)
def predict_tinnitus_profile(
    input_data: TinnitusProfileInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = tinnitus_profile_predictor.recommend(input_data)

    return TinnitusProfileResponse(
        patient_id=current_user.id,
        estimated_frequency_hz=result["estimated_frequency_hz"],
        estimated_intensity_db=result["estimated_intensity_db"],
        risk_level=result["risk_level"],
        risk_score=result["risk_score"],
        ai_recommendation=result.get("ai_recommendation", ""),
        sound_therapy=SoundTherapy(**result.get("sound_therapy", {})),
        model_version=result["model_version"],
        prediction_date=datetime.now(timezone.utc),
    )
