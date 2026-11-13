from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    callsign: Mapped[str] = mapped_column(String(40), default="")
    role: Mapped[str] = mapped_column(String(80), default="Crew Member")
    password_hash: Mapped[str] = mapped_column(String(256))
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Mission(Base):
    __tablename__ = "missions"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Astronaut(Base):
    __tablename__ = "astronauts"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    callsign: Mapped[str] = mapped_column(String(40), unique=True)
    specialty: Mapped[str] = mapped_column(String(120))
    mission_id: Mapped[int] = mapped_column(ForeignKey("missions.id"), index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    age: Mapped[int] = mapped_column(Integer, default=34)
    blood_type: Mapped[str] = mapped_column(String(10), default="O+")
    notes: Mapped[str] = mapped_column(Text, default="")
    emergency_contact: Mapped[str] = mapped_column(String(120), default="")
    resting_hr: Mapped[int] = mapped_column(Integer, default=65)
    max_hr: Mapped[int] = mapped_column(Integer, default=175)
    mission: Mapped[Mission] = relationship()


class Metric(Base):
    __tablename__ = "metrics"
    id: Mapped[int] = mapped_column(primary_key=True)
    astronaut_id: Mapped[int] = mapped_column(ForeignKey("astronauts.id"), index=True)
    key: Mapped[str] = mapped_column(String(50), index=True)
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(30))
    source: Mapped[str] = mapped_column(String(80))
    sampled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    __table_args__ = (UniqueConstraint("astronaut_id", "key", "sampled_at"),)


class MentalCheckin(Base):
    __tablename__ = "mental_checkins"
    id: Mapped[int] = mapped_column(primary_key=True)
    astronaut_id: Mapped[int] = mapped_column(ForeignKey("astronauts.id"), index=True)
    mood: Mapped[int] = mapped_column(Integer)
    focus: Mapped[int] = mapped_column(Integer)
    stress: Mapped[int] = mapped_column(Integer)
    isolation: Mapped[int] = mapped_column(Integer)
    sleep: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text, default="")
    client_operation_id: Mapped[str | None] = mapped_column(String(80), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)
    astronaut_id: Mapped[int | None] = mapped_column(ForeignKey("astronauts.id"), nullable=True)
    level: Mapped[str] = mapped_column(String(20))
    title: Mapped[str] = mapped_column(String(160))
    detail: Mapped[str] = mapped_column(Text)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class MissionEvent(Base):
    __tablename__ = "mission_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    detail: Mapped[str] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(String(30))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class Protocol(Base):
    __tablename__ = "protocols"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text)
    source_url: Mapped[str] = mapped_column(String(500))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    steps: Mapped[list["ProtocolStep"]] = relationship(cascade="all, delete-orphan", order_by="ProtocolStep.position")


class ProtocolStep(Base):
    __tablename__ = "protocol_steps"
    id: Mapped[int] = mapped_column(primary_key=True)
    protocol_id: Mapped[int] = mapped_column(ForeignKey("protocols.id"))
    position: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)


class ProtocolExecution(Base):
    __tablename__ = "protocol_executions"
    id: Mapped[int] = mapped_column(primary_key=True)
    protocol_id: Mapped[int] = mapped_column(ForeignKey("protocols.id"))
    astronaut_id: Mapped[int] = mapped_column(ForeignKey("astronauts.id"))
    completed_steps: Mapped[str] = mapped_column(Text, default="[]")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

