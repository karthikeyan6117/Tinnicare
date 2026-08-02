from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timezone

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.health_record import SymptomRecord, SymptomSeverity
from app.models.assessment import RiskAssessment, RiskLevel
from app.schemas.health import SymptomCreate, SymptomResponse
from app.schemas.prediction import PredictionInput
from app.schemas.tinnitus_profile import TinnitusProfileInput
from app.services.prediction_service import risk_predictor
from app.services.tinnitus_profile_service import tinnitus_profile_predictor
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/symptoms", tags=["Symptoms"])


def _map_severity_enum(severity: str) -> int:
    mapping = {
        "mild": 1,
        "moderate": 2,
        "severe": 3,
        "very_severe": 4,
    }
    return mapping.get(severity, 2)


def _derive_sleep_hours(sleep_quality, sleep_hours=None) -> float:
    if sleep_hours is not None:
        return max(2.0, min(9.0, float(sleep_hours)))
    if sleep_quality is not None:
        return max(2.0, min(9.0, 1.5 + float(sleep_quality) * 0.75))
    return 5.5


def _estimate_tinnitus_profile(payload: SymptomCreate) -> dict:
    """Run the linear regression model to estimate tinnitus frequency (Hz) and intensity (dB)."""
    profile_input = TinnitusProfileInput(
        stress_level=payload.stress_level or 5,
        sleep_hours=_derive_sleep_hours(payload.sleep_quality, payload.sleep_hours),
        loudness_level=payload.loudness_level or 5,
        hearing_loss=payload.hearing_loss or "No",
    )
    return tinnitus_profile_predictor.predict(profile_input)


@router.post("", response_model=SymptomResponse, status_code=status.HTTP_201_CREATED)
def create_symptom(
    payload: SymptomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recorded_at = payload.recorded_at or datetime.now(timezone.utc)

    record = SymptomRecord(
        patient_id=current_user.id,
        severity=payload.severity,
        loudness_level=payload.loudness_level,
        frequency_hz=payload.frequency_hz,
        duration_minutes=payload.duration_minutes,
        description=payload.description,
        sleep_quality=payload.sleep_quality,
        stress_level=payload.stress_level,
        recorded_at=recorded_at,
    )
    db.add(record)
    db.flush()

    try:
        profile = _estimate_tinnitus_profile(payload)
        record.frequency_hz = payload.frequency_hz or profile["estimated_frequency_hz"]
        record.intensity_db = profile["estimated_intensity_db"]
    except Exception as e:
        logger.warning(f"Tinnitus profile estimation failed, storing record without estimates: {e}")

    prediction_input = PredictionInput(
        severity=_map_severity_enum(payload.severity),
        duration_minutes=payload.duration_minutes or 30,
        stress_level=payload.stress_level or 5,
        sleep_quality=payload.sleep_quality or 5,
        loudness_level=payload.loudness_level or 5,
        frequency_hz=payload.frequency_hz or 4000.0,
        recent_triggers_count=0,
    )
    model_result = risk_predictor.predict(prediction_input)

    assessment = RiskAssessment(
        patient_id=current_user.id,
        risk_level=RiskLevel(model_result["predicted_risk"]),
        risk_score=model_result["predicted_severity_score"],
        predicted_severity=model_result.get("predicted_risk"),
        flare_up_probability=model_result.get("flare_up_probability"),
        recommendation=model_result.get("recommendation"),
        model_version=model_result.get("model_version", "rf_v1"),
        assessment_date=recorded_at,
    )
    db.add(assessment)

    db.commit()
    db.refresh(record)
    return SymptomResponse.model_validate(record)


@router.get("", response_model=List[SymptomResponse])
def list_symptoms(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.patient_id == current_user.id)
        .order_by(SymptomRecord.recorded_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [SymptomResponse.model_validate(r) for r in records]


@router.get("/{record_id}", response_model=SymptomResponse)
def get_symptom(
    record_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(SymptomRecord).filter(
        SymptomRecord.id == record_id,
        SymptomRecord.patient_id == current_user.id,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Symptom record not found")
    return SymptomResponse.model_validate(record)
