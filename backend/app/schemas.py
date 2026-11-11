from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AstronautInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    callsign: str = Field(min_length=2, max_length=40)
    specialty: str = Field(min_length=2, max_length=120)
    mission_id: int


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
    astronaut_id: int
    question: str = Field(min_length=2, max_length=2000)


class ProtocolInput(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    description: str = Field(min_length=10, max_length=3000)
    source_url: str = Field(pattern=r"^https://", max_length=500)
    steps: list[str] = Field(min_length=1, max_length=30)
