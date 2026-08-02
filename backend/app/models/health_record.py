import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship

from app.core.database import Base, UUIDType
import enum


class SymptomSeverity(str, enum.Enum):
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"
    VERY_SEVERE = "very_severe"


class SymptomRecord(Base):
    __tablename__ = "symptom_records"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    severity = Column(Enum(SymptomSeverity), nullable=False)
    loudness_level = Column(Integer, nullable=True)
    frequency_hz = Column(Float, nullable=True)
    intensity_db = Column(Float, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    sleep_quality = Column(Integer, nullable=True)
    stress_level = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    patient = relationship("User")


class TriggerRecord(Base):
    __tablename__ = "trigger_records"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    trigger_type = Column(String(100), nullable=False)
    trigger_value = Column(String(255), nullable=True)
    severity_before = Column(Enum(SymptomSeverity), nullable=True)
    severity_after = Column(Enum(SymptomSeverity), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    patient = relationship("User")


class HealthMetric(Base):
    __tablename__ = "health_metrics"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    metric_type = Column(String(100), nullable=False)
    metric_value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    recorded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)

    patient = relationship("User")
