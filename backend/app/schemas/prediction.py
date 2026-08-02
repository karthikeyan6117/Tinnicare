from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class PredictionInput(BaseModel):
    severity: int
    duration_minutes: int
    stress_level: int
    sleep_quality: int
    loudness_level: int
    frequency_hz: float
    recent_triggers_count: int = 0
    days_since_last_flare_up: int = 30


class PredictionResponse(BaseModel):
    patient_id: UUID
    predicted_risk: str
    predicted_severity_score: float
    flare_up_probability: float
    recommendation: str
    prediction_date: datetime
