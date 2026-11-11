"""Clearly labeled synthetic demo records; no real astronaut health data."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from .models import Astronaut, Metric, Mission, MissionEvent, Notification


METRICS = {
    "heart_rate": ("bpm", 68),
    "hrv": ("ms", 54),
    "spo2": ("%", 98),
    "respiratory_rate": ("/min", 15),
    "sleep_duration": ("h", 7.3),
    "sleep_quality": ("/5", 4),
    "radiation_exposure": ("mSv", 0.11),
    "stress": ("/5", 2),
    "mood": ("/5", 4),
    "focus": ("/5", 4),
    "activity": ("min", 52),
    "hydration": ("L", 2.1),
}


def seed(db: Session):
    if db.scalar(select(Mission.id).limit(1)):
        return
    start = datetime.now(timezone.utc) - timedelta(days=18)
    mission = Mission(name="Asteria Demonstration Mission", started_at=start)
    db.add(mission)
    db.flush()
    crew = [
        ("Maya Chen", "NOVA-01", "Mission commander"),
        ("Ibrahim Rahman", "ORBIT-02", "Flight engineer"),
        ("Elena Petrova", "PULSE-03", "Research specialist"),
        ("Luis Ortega", "VECTOR-04", "Medical officer"),
    ]
    for index, (name, callsign, specialty) in enumerate(crew):
        person = Astronaut(name=name, callsign=callsign, specialty=specialty, mission_id=mission.id)
        db.add(person)
        db.flush()
        for key, (unit, base) in METRICS.items():
            for day in range(14):
                value = base + ((day * 7 + index * 3) % 9 - 4) * (0.01 if key == "radiation_exposure" else 0.08 if key in {"sleep_duration", "hydration"} else 0.45)
                if key in {"stress", "mood", "focus", "sleep_quality"}:
                    value = max(1, min(5, round(value)))
                db.add(Metric(astronaut_id=person.id, key=key, value=round(value, 2), unit=unit, source="simulated demo", sampled_at=datetime.now(timezone.utc) - timedelta(days=13-day)))
    db.add(MissionEvent(title="Demonstration mission started", detail="Synthetic mission timeline for product evaluation.", kind="mission", occurred_at=start))
    db.add(Notification(level="info", title="Demo telemetry ready", detail="All measurements shown are synthetic and are not from actual astronauts."))
    db.commit()
