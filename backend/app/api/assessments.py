from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User, PatientProfile
from app.models.assessment import RiskAssessment, CarePlan, RehabilitationActivity, RiskLevel
from app.schemas.assessment import (
    InitialAssessmentCreate,
    InitialAssessmentResponse,
    RiskAssessmentResponse,
    CarePlanCreate,
    CarePlanResponse,
    ActivityCreate,
    ActivityResponse,
    DoctorNotesUpdate,
    MedicalHistoryItem,
    MedicalHistoryPatient,
    MedicalHistoryResponse,
)
from app.schemas.prediction import PredictionInput
from app.models.health_record import SymptomRecord, SymptomSeverity
from app.services.prediction_service import risk_predictor
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def _compute_initial_risk(payload: InitialAssessmentCreate) -> tuple[str, float]:
    score = 0.0

    severity_map = {
        "Mild (hardly noticeable)": 2,
        "Moderate (noticeable but manageable)": 5,
        "Severe (disrupts daily life)": 8,
        "Very Severe (debilitating)": 10,
    }
    score += severity_map.get(payload.severity, 5)

    frequency_map = {
        "Rarely (a few times a month)": 1,
        "Sometimes (a few times a week)": 3,
        "Often (daily)": 6,
        "Constantly (always present)": 9,
    }
    score += frequency_map.get(payload.frequency, 3)

    stress_map = {
        "Low": 1,
        "Moderate": 4,
        "High": 7,
        "Very High": 10,
    }
    score += stress_map.get(payload.stress_level, 4)

    sleep_map = {
        "Not at all": 0,
        "Slightly (sometimes delays sleep)": 3,
        "Moderately (often affects sleep)": 6,
        "Severely (significantly impacts sleep)": 9,
    }
    score += sleep_map.get(payload.sleep_impact, 3)

    onset_map = {
        "Less than 3 months ago": 1,
        "3-6 months ago": 3,
        "6-12 months ago": 5,
        "More than a year ago": 7,
    }
    score += onset_map.get(payload.onset, 3)

    score = score / 5.0

    if score < 3:
        return "low", score
    elif score < 6:
        return "medium", score
    else:
        return "high", score


def _map_severity(payload_severity: str) -> int:
    mapping = {
        "Mild (hardly noticeable)": 1,
        "Moderate (noticeable but manageable)": 2,
        "Severe (disrupts daily life)": 3,
        "Very Severe (debilitating)": 4,
    }
    return mapping.get(payload_severity, 2)


def _map_frequency_duration(payload_frequency: str) -> int:
    mapping = {
        "Rarely (a few times a month)": 20,
        "Sometimes (a few times a week)": 60,
        "Often (daily)": 120,
        "Constantly (always present)": 240,
    }
    return mapping.get(payload_frequency, 60)


def _map_stress_level(payload_stress: str) -> int:
    mapping = {
        "Low": 2,
        "Moderate": 5,
        "High": 8,
        "Very High": 10,
    }
    return mapping.get(payload_stress, 5)


def _map_sleep_quality(payload_sleep: str) -> int:
    mapping = {
        "Not at all": 9,
        "Slightly (sometimes delays sleep)": 7,
        "Moderately (often affects sleep)": 5,
        "Severely (significantly impacts sleep)": 2,
    }
    return mapping.get(payload_sleep, 5)


@router.post("/initial", response_model=InitialAssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_initial_assessment(
    payload: InitialAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value != "patient":
        raise HTTPException(status_code=403, detail="Only patients can submit initial assessment")

    heuristic_risk, heuristic_score = _compute_initial_risk(payload)

    prediction_input = PredictionInput(
        severity=_map_severity(payload.severity),
        duration_minutes=_map_frequency_duration(payload.frequency),
        stress_level=_map_stress_level(payload.stress_level),
        sleep_quality=_map_sleep_quality(payload.sleep_impact),
        loudness_level=5,
        frequency_hz=4000.0,
        recent_triggers_count=0,
    )
    model_result = risk_predictor.predict(prediction_input)
    risk_level = model_result["predicted_risk"]
    risk_score = model_result["predicted_severity_score"]

    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)

    age = payload.age
    if age:
        approx_dob = datetime.now(timezone.utc) - timedelta(days=age * 365)
        profile.date_of_birth = approx_dob

    profile.tinnitus_type = payload.tinnitus_type
    profile.severity_level = payload.severity
    profile.medical_history = str({
        "onset": payload.onset,
        "frequency": payload.frequency,
        "sleep_impact": payload.sleep_impact,
        "stress_level": payload.stress_level,
        "hearing_issues": payload.hearing_issues,
        "previous_treatment": payload.previous_treatment,
    })
    db.flush()

    existing = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.patient_id == current_user.id)
        .order_by(RiskAssessment.assessment_date.desc())
        .first()
    )

    if existing and existing.assessment_date and existing.assessment_date.date() == datetime.now(timezone.utc).date():
        existing.risk_level = RiskLevel(risk_level)
        existing.risk_score = risk_score
        existing.predicted_severity = model_result.get("predicted_risk")
        existing.flare_up_probability = model_result.get("flare_up_probability")
        existing.recommendation = model_result.get("recommendation")
        existing.model_version = model_result.get("model_version", "rf_v1")
        existing.assessment_date = datetime.now(timezone.utc)
    else:
        assessment = RiskAssessment(
            patient_id=current_user.id,
            risk_level=RiskLevel(risk_level),
            risk_score=risk_score,
            predicted_severity=model_result.get("predicted_risk"),
            flare_up_probability=model_result.get("flare_up_probability"),
            recommendation=model_result.get("recommendation"),
            model_version=model_result.get("model_version", "rf_v1"),
        )
        db.add(assessment)

    first_symptom = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.patient_id == current_user.id)
        .first()
    )
    if not first_symptom:
        severity_enum = SymptomSeverity.MODERATE
        if risk_level == "low":
            severity_enum = SymptomSeverity.MILD
        elif risk_level == "high":
            severity_enum = SymptomSeverity.SEVERE

        symptom = SymptomRecord(
            patient_id=current_user.id,
            severity=severity_enum,
            description=f"Initial assessment: {payload.severity}",
        )
        db.add(symptom)

    db.commit()

    return InitialAssessmentResponse(
        id=current_user.id,
        risk_level=risk_level,
        risk_score=round(risk_score, 1),
        message="Assessment completed successfully",
    )


@router.get("/risk", response_model=List[RiskAssessmentResponse])
def get_risk_assessments(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.patient_id == current_user.id)
        .order_by(RiskAssessment.assessment_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [RiskAssessmentResponse.model_validate(r) for r in records]


@router.get("/risk/latest", response_model=RiskAssessmentResponse)
def get_latest_risk_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.patient_id == current_user.id)
        .order_by(RiskAssessment.assessment_date.desc())
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="No risk assessment found")
    return RiskAssessmentResponse.model_validate(record)


def _as_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _nearest_symptom(assessment_date: Optional[datetime], symptoms: List[SymptomRecord]):
    """Best-effort match of a symptom record to an assessment by nearest recorded time."""
    if not symptoms or assessment_date is None:
        return None
    target = _as_utc(assessment_date)
    best = None
    best_diff = None
    for s in symptoms:
        recorded = _as_utc(s.recorded_at)
        if recorded is None:
            continue
        diff = abs((recorded - target).total_seconds())
        if best_diff is None or diff < best_diff:
            best_diff = diff
            best = s
    return best


def _estimate_thi(risk_score: float) -> float:
    """Estimate a Tinnitus Handicap Inventory (0-100) score from the ML risk score (1-10)."""
    return round(max(0.0, min(100.0, risk_score * 9.0)), 1)


def _stress_label(level: Optional[int]) -> Optional[str]:
    if level is None:
        return None
    if level <= 3:
        return "Low"
    if level <= 6:
        return "Medium"
    if level <= 8:
        return "High"
    return "Very High"


def _format_minutes(minutes: Optional[int]) -> Optional[str]:
    if minutes is None:
        return None
    if minutes < 60:
        return f"{minutes} min"
    hours = minutes / 60
    if hours == int(hours):
        return f"{int(hours)} hr{'s' if hours != 1 else ''}"
    return f"{hours:.1f} hrs"


def _sleep_hours(quality: Optional[int], profile: Optional[PatientProfile]) -> Optional[str]:
    if quality is not None:
        hours = round((quality / 10.0) * 8.0, 1)
        return f"{hours:g} hrs"
    return profile.sleep_hours if profile else None


def _parse_sound_type(description: Optional[str], profile: Optional[PatientProfile]) -> Optional[str]:
    if description:
        text = str(description)
        for prefix in ("sound type:", "sound:"):
            idx = text.lower().find(prefix)
            if idx != -1:
                value = text[idx + len(prefix):].strip().strip(".-:")
                if value:
                    return value
    return profile.sound_type if profile else "Ringing"


def _build_history_item(
    assessment: RiskAssessment,
    symptom: Optional[SymptomRecord],
    profile: Optional[PatientProfile],
) -> MedicalHistoryItem:
    stress = symptom.stress_level if symptom else None
    return MedicalHistoryItem(
        id=assessment.id,
        assessment_date=assessment.assessment_date,
        risk_level=assessment.risk_level.value if isinstance(assessment.risk_level, RiskLevel) else str(assessment.risk_level),
        risk_score=assessment.risk_score,
        thi_score=_estimate_thi(assessment.risk_score),
        predicted_severity=assessment.predicted_severity,
        flare_up_probability=assessment.flare_up_probability,
        recommendation=assessment.recommendation,
        doctor_notes=assessment.doctor_notes,
        model_version=assessment.model_version,
        loudness=symptom.loudness_level if symptom else None,
        stress_level=stress,
        stress_label=_stress_label(stress),
        sleep_quality=symptom.sleep_quality if symptom else None,
        sleep_hours=_sleep_hours(symptom.sleep_quality if symptom else None, profile),
        duration_minutes=symptom.duration_minutes if symptom else None,
        duration_label=_format_minutes(symptom.duration_minutes if symptom else None),
        sound_type=_parse_sound_type(symptom.description if symptom else None, profile),
        tinnitus_duration=profile.tinnitus_duration if profile else None,
    )


@router.get("/history", response_model=MedicalHistoryResponse)
def get_medical_history(
    patient_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Grouped patient medical history derived from all risk assessments, ready for doctor review."""
    target_user_id = current_user.id
    if patient_id:
        if current_user.role.value != "doctor" and patient_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this patient's history")
        target_user_id = patient_id

    assessments = (
        db.query(RiskAssessment)
        .filter(RiskAssessment.patient_id == target_user_id)
        .order_by(RiskAssessment.assessment_date.asc())
        .all()
    )
    symptoms = (
        db.query(SymptomRecord)
        .filter(SymptomRecord.patient_id == target_user_id)
        .order_by(SymptomRecord.recorded_at.asc())
        .all()
    )
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == target_user_id).first()
    patient_user = db.query(User).filter(User.id == target_user_id).first()

    age = None
    if profile and profile.date_of_birth:
        age = max(0, (datetime.now(timezone.utc).date() - profile.date_of_birth.date()).days // 365)

    patient_info = MedicalHistoryPatient(
        id=target_user_id,
        full_name=patient_user.full_name if patient_user else "Patient",
        email=patient_user.email if patient_user else "",
        age=age,
        gender=profile.gender if profile else None,
        affected_ear=profile.affected_ear if profile else None,
        sound_type=profile.sound_type if profile else None,
        tinnitus_duration=profile.tinnitus_duration if profile else None,
        medical_conditions=profile.medical_conditions if profile else None,
    )

    records = []
    counts = {"low": 0, "medium": 0, "high": 0}
    for a in assessments:
        symptom = _nearest_symptom(a.assessment_date, symptoms)
        item = _build_history_item(a, symptom, profile)
        records.append(item)
        counts[item.risk_level] = counts.get(item.risk_level, 0) + 1

    return MedicalHistoryResponse(
        patient=patient_info,
        total=len(records),
        low=counts["low"],
        medium=counts["medium"],
        high=counts["high"],
        records=records,
    )


@router.patch("/{assessment_id}/notes", response_model=RiskAssessmentResponse)
def update_doctor_notes(
    assessment_id: UUID,
    payload: DoctorNotesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value != "doctor":
        raise HTTPException(status_code=403, detail="Only doctors can add clinical notes")

    assessment = db.query(RiskAssessment).filter(RiskAssessment.id == assessment_id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")

    assessment.doctor_notes = payload.doctor_notes
    db.commit()
    db.refresh(assessment)
    return RiskAssessmentResponse.model_validate(assessment)


@router.post("/care-plans", response_model=CarePlanResponse, status_code=status.HTTP_201_CREATED)
def create_care_plan(
    payload: CarePlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = CarePlan(
        patient_id=payload.patient_id,
        doctor_id=current_user.id,
        title=payload.title,
        description=payload.description,
        duration_days=payload.duration_days,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return CarePlanResponse.model_validate(plan)


@router.get("/care-plans", response_model=List[CarePlanResponse])
def list_care_plans(
    patient_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plans = (
        db.query(CarePlan)
        .filter(CarePlan.patient_id == patient_id)
        .order_by(CarePlan.created_at.desc())
        .all()
    )
    return [CarePlanResponse.model_validate(p) for p in plans]


@router.post("/care-plans/{plan_id}/activities", response_model=ActivityResponse, status_code=status.HTTP_201_CREATED)
def add_activity(
    plan_id: UUID,
    payload: ActivityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    plan = db.query(CarePlan).filter(CarePlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Care plan not found")

    activity = RehabilitationActivity(
        care_plan_id=plan_id,
        activity_type=payload.activity_type,
        title=payload.title,
        description=payload.description,
        duration_minutes=payload.duration_minutes,
        frequency=payload.frequency,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return ActivityResponse.model_validate(activity)


@router.patch("/activities/{activity_id}/complete", response_model=ActivityResponse)
def complete_activity(
    activity_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    activity = db.query(RehabilitationActivity).filter(
        RehabilitationActivity.id == activity_id,
    ).first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    from datetime import datetime, timezone
    activity.is_completed = True
    activity.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(activity)
    return ActivityResponse.model_validate(activity)
