from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_user
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, UserRole, PatientProfile
from app.models.assessment import RiskAssessment, RiskLevel
from app.models.health_record import SymptomRecord, SymptomSeverity
from app.schemas.user import (
    UserCreate, UserLogin, TokenResponse, UserResponse, MessageResponse,
    ProfileUpdate, ProfileStatusResponse, ProfileDetailResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    role = UserRole.DOCTOR if payload.role == "doctor" else UserRole.PATIENT
    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=get_password_hash(payload.password),
        role=role,
    )
    db.add(user)
    db.flush()

    if role == UserRole.PATIENT:
        profile = PatientProfile(user_id=user.id)
        if payload.age:
            profile.date_of_birth = datetime.now(timezone.utc) - timedelta(days=payload.age * 365)
        profile.gender = payload.gender
        profile.occupation = payload.occupation
        profile.height = payload.height
        profile.weight = payload.weight
        profile.hearing_aid = payload.hearing_aid
        db.add(profile)

    db.commit()
    return MessageResponse(message="Registration successful. Please login.")


@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=token, user=UserResponse.model_validate(user))


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.get("/profile/status", response_model=ProfileStatusResponse)
def profile_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        return ProfileStatusResponse(completed=False, basic_done=False, medical_done=False, tinnitus_done=False, lifestyle_done=False)

    basic_done = bool(profile.occupation or profile.height or profile.weight or profile.hearing_aid)
    medical_done = bool(profile.existing_conditions or profile.medications or profile.family_history or profile.allergies or profile.medical_conditions)
    tinnitus_done = bool(profile.affected_ear or profile.sound_type or profile.severity_rating)
    lifestyle_done = bool(profile.smoking or profile.alcohol or profile.caffeine or profile.substance_consumption or profile.exercise or profile.sleep_hours or profile.coffee_intake or profile.daily_stress or profile.noise_exposure)

    return ProfileStatusResponse(
        completed=profile.profile_completed,
        basic_done=basic_done,
        medical_done=medical_done,
        tinnitus_done=tinnitus_done,
        lifestyle_done=lifestyle_done,
    )


@router.get("/profile", response_model=ProfileDetailResponse)
def profile_detail(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return ProfileDetailResponse.model_validate(profile)


def _save_basic(profile: PatientProfile, data: dict):
    if "date_of_birth" in data and data["date_of_birth"]:
        profile.date_of_birth = data["date_of_birth"]
    elif "age" in data and data["age"]:
        profile.date_of_birth = datetime.now(timezone.utc) - timedelta(days=data["age"] * 365)
    for f in ("gender", "occupation", "height", "weight", "hearing_aid"):
        if f in data:
            setattr(profile, f, data[f])


def _save_medical(profile: PatientProfile, data: dict):
    for f in ("existing_conditions", "medications", "family_history", "allergies", "medical_conditions", "medical_history"):
        if f in data:
            setattr(profile, f, data[f])


def _save_tinnitus(profile: PatientProfile, data: dict):
    for f in ("affected_ear", "sound_type", "tinnitus_duration", "tinnitus_onset", "severity_rating"):
        if f in data:
            setattr(profile, f, data[f])


def _save_lifestyle(profile: PatientProfile, data: dict):
    for f in ("smoking", "alcohol", "caffeine", "substance_consumption", "exercise", "sleep_hours", "coffee_intake", "daily_stress", "noise_exposure"):
        if f in data:
            setattr(profile, f, data[f])


@router.put("/profile", response_model=ProfileStatusResponse)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value != "patient":
        raise HTTPException(status_code=403, detail="Only patients can have a profile")

    profile = db.query(PatientProfile).filter(PatientProfile.user_id == current_user.id).first()
    if not profile:
        profile = PatientProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()

    sections = {"basic": _save_basic, "medical": _save_medical, "tinnitus": _save_tinnitus, "lifestyle": _save_lifestyle}
    for section, saver in sections.items():
        data = getattr(payload, section, None)
        if data is not None:
            saver(profile, data.model_dump(exclude_none=True))

    if payload.mark_completed:
        profile.profile_completed = True
        if not profile.severity_rating:
            profile.severity_rating = profile.severity_rating or "5"

    db.commit()

    basic_done = bool(profile.occupation or profile.height or profile.weight or profile.hearing_aid or profile.date_of_birth)
    medical_done = bool(profile.existing_conditions or profile.medications or profile.family_history or profile.allergies or profile.medical_conditions)
    tinnitus_done = bool(profile.affected_ear or profile.sound_type or profile.severity_rating)
    lifestyle_done = bool(profile.smoking or profile.alcohol or profile.caffeine or profile.substance_consumption or profile.exercise or profile.sleep_hours or profile.coffee_intake or profile.daily_stress or profile.noise_exposure)

    return ProfileStatusResponse(
        completed=profile.profile_completed,
        basic_done=basic_done,
        medical_done=medical_done,
        tinnitus_done=tinnitus_done,
        lifestyle_done=lifestyle_done,
    )
