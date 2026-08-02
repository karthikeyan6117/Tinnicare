import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship

from app.core.database import Base, UUIDType
import enum


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_level = Column(Enum(RiskLevel), nullable=False)
    risk_score = Column(Float, nullable=False)
    predicted_severity = Column(String(50), nullable=True)
    flare_up_probability = Column(Float, nullable=True)
    trigger_insights = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    assessment_date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    model_version = Column(String(50), nullable=True)

    patient = relationship("User")


class CarePlan(Base):
    __tablename__ = "care_plans"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(UUIDType(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_days = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    activities = relationship("RehabilitationActivity", back_populates="care_plan", cascade="all, delete-orphan")


class RehabilitationActivity(Base):
    __tablename__ = "rehabilitation_activities"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    care_plan_id = Column(UUIDType(), ForeignKey("care_plans.id", ondelete="CASCADE"), nullable=False)
    activity_type = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)
    frequency = Column(String(50), nullable=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    care_plan = relationship("CarePlan", back_populates="activities")
