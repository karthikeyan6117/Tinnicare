from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class SymptomCreate(BaseModel):
    severity: str
    loudness_level: Optional[int] = None
    frequency_hz: Optional[float] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    sleep_quality: Optional[int] = None
    stress_level: Optional[int] = None
    sleep_hours: Optional[float] = None
    hearing_loss: Optional[str] = None
    recorded_at: Optional[datetime] = None


class SymptomResponse(BaseModel):
    id: UUID
    patient_id: UUID
    recorded_at: datetime
    severity: str
    loudness_level: Optional[int] = None
    frequency_hz: Optional[float] = None
    intensity_db: Optional[float] = None
    duration_minutes: Optional[int] = None
    description: Optional[str] = None
    sleep_quality: Optional[int] = None
    stress_level: Optional[int] = None

    model_config = {"from_attributes": True}


class TriggerCreate(BaseModel):
    trigger_type: str
    trigger_value: Optional[str] = None
    severity_before: Optional[str] = None
    severity_after: Optional[str] = None
    notes: Optional[str] = None


class TriggerResponse(BaseModel):
    id: UUID
    patient_id: UUID
    trigger_type: str
    trigger_value: Optional[str] = None
    severity_before: Optional[str] = None
    severity_after: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class HealthMetricCreate(BaseModel):
    metric_type: str
    metric_value: float
    unit: Optional[str] = None
    notes: Optional[str] = None


class HealthMetricResponse(BaseModel):
    id: UUID
    patient_id: UUID
    metric_type: str
    metric_value: float
    unit: Optional[str] = None
    recorded_at: datetime

    model_config = {"from_attributes": True}
