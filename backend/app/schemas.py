from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class AstronautInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    callsign: str = Field(min_length=2, max_length=40)
    specialty: str = Field(min_length=2, max_length=120)
    mission_id: int = 1
    avatar_url: Optional[str] = None
    age: Optional[int] = 34
    blood_type: Optional[str] = "O+"
    notes: Optional[str] = ""
    emergency_contact: Optional[str] = ""
    resting_hr: Optional[int] = 65
    max_hr: Optional[int] = 175


class AstronautOut(AstronautInput):
    model_config = ConfigDict(from_attributes=True)
    id: int
    active: bool


class MetricInput(BaseModel):
    key: str = Field(min_length=2, max_length=50)
    value: float
    unit: str = Field(max_length=30)
    sampled_at: datetime


class CheckinInput(BaseModel):
    mood: int = Field(ge=1, le=5)
    focus: int = Field(ge=1, le=5)
    stress: int = Field(ge=1, le=5)
    isolation: int = Field(ge=1, le=5)
    sleep: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=1000)


class AIInput(BaseModel):
    astronaut_id: Optional[int] = 1
    question: Optional[str] = None
    query: Optional[str] = None
    metrics_snapshot: Optional[list] = None


class ProtocolInput(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=3000)
    source_url: str = Field(pattern=r"^https://", max_length=500)
    steps: list[str] = Field(min_length=1, max_length=30)


class ProtocolExecutionInput(BaseModel):
    astronaut_id: Optional[int] = None
    completed_steps: list[int] = []
    executed_by: Optional[str] = None
    notes: Optional[str] = None


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=4, max_length=120)
    full_name: str = Field(min_length=2, max_length=120)
    callsign: str = Field(default="", max_length=40)
    role: str = Field(default="Crew Member", max_length=80)
    access_code: Optional[str] = None
    avatar_url: Optional[str] = None


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=160)
    password: str = Field(min_length=1, max_length=120)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    callsign: str
    role: str
    avatar_url: Optional[str] = None


class AvatarUpdateInput(BaseModel):
    avatar_url: str = Field(min_length=5, max_length=10000000)


class AuthResponse(BaseModel):
    token: str
    user: UserOut


class MissionEventInput(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    detail: str = Field(min_length=5, max_length=2000)
    kind: str = Field(default="medical", max_length=50)
