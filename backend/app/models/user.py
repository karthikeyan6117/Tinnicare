import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship

from app.core.database import Base, UUIDType
import enum


class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.PATIENT, nullable=False)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    oauth_accounts = relationship("OAuthAccount", back_populates="user", cascade="all, delete-orphan")
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")


class OAuthAccount(Base):
    __tablename__ = "oauth_accounts"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)
    provider_account_id = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="oauth_accounts")


class PatientProfile(Base):
    __tablename__ = "patient_profiles"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    profile_completed = Column(Boolean, default=False)

    date_of_birth = Column(DateTime, nullable=True)
    gender = Column(String(20), nullable=True)
    occupation = Column(String(100), nullable=True)
    height = Column(String(20), nullable=True)
    weight = Column(String(20), nullable=True)
    hearing_aid = Column(String(10), nullable=True)

    existing_conditions = Column(Text, nullable=True)
    medications = Column(Text, nullable=True)
    family_history = Column(Text, nullable=True)
    allergies = Column(Text, nullable=True)

    affected_ear = Column(String(50), nullable=True)
    sound_type = Column(String(100), nullable=True)
    tinnitus_duration = Column(String(50), nullable=True)
    tinnitus_onset = Column(String(50), nullable=True)
    severity_rating = Column(String(10), nullable=True)

    medical_conditions = Column(Text, nullable=True)

    smoking = Column(String(50), nullable=True)
    alcohol = Column(String(50), nullable=True)
    caffeine = Column(String(50), nullable=True)
    substance_consumption = Column(String(50), nullable=True)
    exercise = Column(String(50), nullable=True)

    sleep_hours = Column(String(20), nullable=True)
    coffee_intake = Column(String(20), nullable=True)
    daily_stress = Column(String(20), nullable=True)
    noise_exposure = Column(String(20), nullable=True)

    tinnitus_onset_date = Column(DateTime, nullable=True)
    tinnitus_type = Column(String(50), nullable=True)
    severity_level = Column(String(20), nullable=True)
    medical_history = Column(Text, nullable=True)
    audio_profile_data = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="patient_profile")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id = Column(UUIDType(), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUIDType(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    specialization = Column(String(255), nullable=True)
    license_number = Column(String(100), nullable=True)
    hospital_affiliation = Column(String(255), nullable=True)
    years_of_experience = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="doctor_profile")
