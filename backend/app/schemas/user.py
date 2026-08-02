from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "patient"
    age: Optional[int] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    hearing_aid: Optional[str] = None


class MessageResponse(BaseModel):
    message: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class OAuthLogin(BaseModel):
    provider: str
    provider_token: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProfileBasic(BaseModel):
    age: Optional[int] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    hearing_aid: Optional[str] = None


class ProfileMedical(BaseModel):
    existing_conditions: Optional[str] = None
    medications: Optional[str] = None
    family_history: Optional[str] = None
    allergies: Optional[str] = None
    medical_conditions: Optional[str] = None
    medical_history: Optional[str] = None


class ProfileTinnitus(BaseModel):
    affected_ear: Optional[str] = None
    sound_type: Optional[str] = None
    tinnitus_duration: Optional[str] = None
    tinnitus_onset: Optional[str] = None
    severity_rating: Optional[str] = None


class ProfileLifestyle(BaseModel):
    smoking: Optional[str] = None
    alcohol: Optional[str] = None
    caffeine: Optional[str] = None
    substance_consumption: Optional[str] = None
    exercise: Optional[str] = None
    sleep_hours: Optional[str] = None
    coffee_intake: Optional[str] = None
    daily_stress: Optional[str] = None
    noise_exposure: Optional[str] = None


class ProfileUpdate(BaseModel):
    basic: Optional[ProfileBasic] = None
    medical: Optional[ProfileMedical] = None
    tinnitus: Optional[ProfileTinnitus] = None
    lifestyle: Optional[ProfileLifestyle] = None
    mark_completed: Optional[bool] = False


class ProfileStatusResponse(BaseModel):
    completed: bool
    basic_done: bool
    medical_done: bool
    tinnitus_done: bool
    lifestyle_done: bool


class ProfileDetailResponse(BaseModel):
    id: UUID
    user_id: UUID
    profile_completed: bool
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    occupation: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    hearing_aid: Optional[str] = None
    existing_conditions: Optional[str] = None
    medications: Optional[str] = None
    family_history: Optional[str] = None
    allergies: Optional[str] = None
    affected_ear: Optional[str] = None
    sound_type: Optional[str] = None
    tinnitus_duration: Optional[str] = None
    tinnitus_onset: Optional[str] = None
    severity_rating: Optional[str] = None
    medical_conditions: Optional[str] = None
    medical_history: Optional[str] = None
    smoking: Optional[str] = None
    alcohol: Optional[str] = None
    caffeine: Optional[str] = None
    substance_consumption: Optional[str] = None
    exercise: Optional[str] = None
    sleep_hours: Optional[str] = None
    coffee_intake: Optional[str] = None
    daily_stress: Optional[str] = None
    noise_exposure: Optional[str] = None

    model_config = {"from_attributes": True}


class UserProfileResponse(BaseModel):
    id: UUID
    email: str
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    medical_history: Optional[str] = None
    created_at: datetime
