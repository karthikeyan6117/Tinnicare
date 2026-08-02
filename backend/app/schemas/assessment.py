from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class InitialAssessmentCreate(BaseModel):
    tinnitus_type: str
    onset: str
    frequency: str
    severity: str
    sleep_impact: str
    stress_level: str
    age: int
    hearing_issues: Optional[str] = None
    previous_treatment: Optional[str] = None


class InitialAssessmentResponse(BaseModel):
    id: UUID
    risk_level: str
    risk_score: float
    message: str


class RiskAssessmentResponse(BaseModel):
    id: UUID
    patient_id: UUID
    risk_level: str
    risk_score: float
    predicted_severity: Optional[str] = None
    flare_up_probability: Optional[float] = None
    trigger_insights: Optional[str] = None
    recommendation: Optional[str] = None
    doctor_notes: Optional[str] = None
    assessment_date: datetime

    model_config = {"from_attributes": True}


class DoctorNotesUpdate(BaseModel):
    doctor_notes: Optional[str] = None


class MedicalHistoryPatient(BaseModel):
    id: UUID
    full_name: str
    email: str
    age: Optional[int] = None
    gender: Optional[str] = None
    affected_ear: Optional[str] = None
    sound_type: Optional[str] = None
    tinnitus_duration: Optional[str] = None
    medical_conditions: Optional[str] = None


class MedicalHistoryItem(BaseModel):
    id: UUID
    assessment_date: datetime
    risk_level: str
    risk_score: float
    thi_score: float
    predicted_severity: Optional[str] = None
    flare_up_probability: Optional[float] = None
    recommendation: Optional[str] = None
    doctor_notes: Optional[str] = None
    model_version: Optional[str] = None
    loudness: Optional[int] = None
    stress_level: Optional[int] = None
    stress_label: Optional[str] = None
    sleep_quality: Optional[int] = None
    sleep_hours: Optional[str] = None
    duration_minutes: Optional[int] = None
    duration_label: Optional[str] = None
    sound_type: Optional[str] = None
    tinnitus_duration: Optional[str] = None


class MedicalHistoryResponse(BaseModel):
    patient: MedicalHistoryPatient
    total: int
    low: int
    medium: int
    high: int
    records: List[MedicalHistoryItem]


class CarePlanCreate(BaseModel):
    patient_id: UUID
    title: str
    description: Optional[str] = None
    duration_days: Optional[int] = None


class CarePlanResponse(BaseModel):
    id: UUID
    patient_id: UUID
    doctor_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    duration_days: Optional[int] = None
    is_active: bool
    created_at: datetime
    activities: list["ActivityResponse"] = []

    model_config = {"from_attributes": True}


class ActivityCreate(BaseModel):
    activity_type: str
    title: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    frequency: Optional[str] = None


class ActivityResponse(BaseModel):
    id: UUID
    care_plan_id: UUID
    activity_type: str
    title: str
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    frequency: Optional[str] = None
    is_completed: bool
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
