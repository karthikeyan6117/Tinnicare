from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class TinnitusProfileInput(BaseModel):
    stress_level: int = Field(ge=1, le=10, description="Self-reported daily stress level (1-10).")
    sleep_hours: float = Field(ge=0, le=24, description="Average nightly sleep duration in hours.")
    loudness_level: int = Field(ge=1, le=10, description="Self-reported tinnitus loudness (1-10).")
    hearing_loss: str = Field(description="Hearing loss severity: 'No', 'Mild', or 'Yes'.")


class SoundTherapy(BaseModel):
    sound_type: str
    target_frequency_hz: Optional[float] = None
    duration_minutes: int = 20
    description: str


class TinnitusProfileResponse(BaseModel):
    patient_id: UUID
    estimated_frequency_hz: float
    estimated_intensity_db: float
    risk_level: str
    risk_score: float
    ai_recommendation: str
    sound_therapy: SoundTherapy
    model_version: str
    prediction_date: datetime
