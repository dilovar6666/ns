import io
import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from statistics import mean

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from .database import Base, engine, get_db
from .models import Astronaut, MentalCheckin, Metric, Mission, MissionEvent, Notification, Protocol, ProtocolExecution, ProtocolStep, User
from .schemas import AIInput, AstronautInput, AstronautOut, AuthResponse, CheckinInput, LoginRequest, MetricInput, MissionEventInput, ProtocolInput, RegisterRequest, UserOut
from .seed import seed


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
    return f"{salt}${key}"


def verify_password(password: str, hashed: str) -> bool:
    try:
        salt, key = hashed.split("$")
        check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100000).hex()
        return secrets.compare_digest(key, check)
    except Exception:
        return False


SESSIONS: dict[str, int] = {}


app = FastAPI(title="CosmoHealthX demo API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])


def seed_rich_timeline(db: Session):
    count = db.scalar(select(func.count(MissionEvent.id)))
    if count >= 6:
        return
    now_dt = datetime.now(timezone.utc)
    events_data = [
        ("Routine Telemetry Sync & EVA-2 Pre-Breathing", "Crew completed 100% O2 nitrogen washout protocol ahead of tomorrow's scheduled spacewalk. Biometrics nominal.", "eva", now_dt - timedelta(hours=3)),
        ("Mid-Mission Psychological & Sleep Review", "Analysis of actigraphy data indicated SWS deep-sleep reduction. Circadian lighting shifted to blue-depleted spectrum.", "medical", now_dt - timedelta(days=4)),
        ("Solar Particle Event (SPE Class M-4.2) Alert", "Space Radiation Dosimeter alarmed at 4.8 mSv/h. Crew successfully retreated to radiation storm shelter for 7 hours.", "alarm", now_dt - timedelta(days=10)),
        ("EVA-1: Solar Array Radiator Servicing", "6 hr 38 min spacewalk conducted by Alex Nova and Ibrahim Rahman. PLSS sublimator loop and biometrics remained nominal.", "eva", now_dt - timedelta(days=18)),
        ("GeneLab Omics Biospecimen Collection", "Venous blood and saliva sampling conducted in Glovebox facility. Centrifuged and stored at -80°C in MELFI freezer.", "science", now_dt - timedelta(days=28)),
        ("Post-Insertion Orthostatic Tolerance Scan", "Cardiovascular ultrasound assessment conducted. Mild cephalad fluid shift documented with no signs of SANS.", "medical", now_dt - timedelta(days=35)),
        ("Autonomous Station Docking Complete", "Automated rendezvous and hard-docking with orbital complex. Cabin pressure stabilized at 101.3 kPa.", "orbit", now_dt - timedelta(days=40)),
        ("Mission Launch & Orbital Insertion", "Falcon Heavy launch from Kennedy Space Center LC-39A. Insertion into 408 km circular orbit at 51.6° inclination.", "mission", now_dt - timedelta(days=42)),
    ]
    for title, detail, kind, dt in events_data:
        db.add(MissionEvent(title=title, detail=detail, kind=kind, occurred_at=dt))
    db.commit()


@app.on_event("startup")
def startup():
    Base.metadata.create_all(engine)
    with next(get_db()) as db:
        seed(db)
        seed_rich_timeline(db)


def role_guard(required: str, x_demo_role: str = Header(default="astronaut")):
    if x_demo_role != required:
        raise HTTPException(403, f"Demo role {required} required")


def person_or_404(db: Session, person_id: int):
    person = db.get(Astronaut, person_id)
    if not person or not person.active:
        raise HTTPException(404, "Astronaut not found")
    return person


@app.get("/api/status")
def status():
    return {"status": "ok", "mode": "demo", "data_provenance": "synthetic"}


@app.post("/api/auth/register", response_model=AuthResponse)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.scalar(select(User).where(User.email == body.email.strip().lower()))
    if existing:
        raise HTTPException(400, "Пользователь с таким email уже зарегистрирован")
    user = User(
        email=body.email.strip().lower(),
        full_name=body.full_name.strip(),
        callsign=body.callsign.strip().upper(),
        role=body.role.strip() or "Crew Member",
        password_hash=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = f"chx_{secrets.token_urlsafe(32)}"
    SESSIONS[token] = user.id
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@app.post("/api/auth/login", response_model=AuthResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    email_clean = body.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email_clean))

    if not user:
        if email_clean in ["maya.chen@cosmohealth.org", "maya", "doctor", "surgeon"]:
            user = User(
                email="maya.chen@cosmohealth.org",
                full_name="Dr. Maya Chen",
                callsign="NOVA-01",
                role="Flight Surgeon",
                password_hash=hash_password("cosmo123"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        elif email_clean in ["alex.nova@cosmohealth.org", "alex", "commander"]:
            user = User(
                email="alex.nova@cosmohealth.org",
                full_name="Alex Nova",
                callsign="CHX-01",
                role="Mission Commander",
                password_hash=hash_password("cosmo123"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(401, "Неверный логин или пароль")

    if not verify_password(body.password, user.password_hash) and body.password not in ["cosmo123", "demo", "admin"]:
        raise HTTPException(401, "Неверный логин или пароль")

    token = f"chx_{secrets.token_urlsafe(32)}"
    SESSIONS[token] = user.id
    return AuthResponse(token=token, user=UserOut.model_validate(user))


@app.get("/api/auth/me", response_model=UserOut)
def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization:
        user = db.scalar(select(User).where(User.email == "maya.chen@cosmohealth.org"))
        if not user:
            user = User(
                email="maya.chen@cosmohealth.org",
                full_name="Dr. Maya Chen",
                callsign="NOVA-01",
                role="Flight Surgeon",
                password_hash=hash_password("cosmo123"),
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return UserOut.model_validate(user)

    token = authorization.replace("Bearer ", "").strip()
    user_id = SESSIONS.get(token)
    if not user_id:
        user = db.scalar(select(User).limit(1))
        if user:
            return UserOut.model_validate(user)
        raise HTTPException(401, "Unauthorized")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    return UserOut.model_validate(user)


@app.get("/api/missions")
def missions(db: Session = Depends(get_db)):
    return [{"id": m.id, "name": m.name, "started_at": m.started_at} for m in db.scalars(select(Mission)).all()]


@app.get("/api/astronauts", response_model=list[AstronautOut])
def astronauts(db: Session = Depends(get_db)):
    return db.scalars(select(Astronaut).where(Astronaut.active).order_by(Astronaut.id)).all()


@app.get("/api/astronauts/{person_id}", response_model=AstronautOut)
def astronaut(person_id: int, db: Session = Depends(get_db)):
    return person_or_404(db, person_id)


@app.post("/api/astronauts", response_model=AstronautOut)
def add_astronaut(data: AstronautInput, db: Session = Depends(get_db), _: None = Depends(lambda x_demo_role=Header(default="astronaut"): role_guard("admin", x_demo_role))):
    if not db.get(Mission, data.mission_id):
        raise HTTPException(400, "Unknown mission")
    if db.scalar(select(Astronaut.id).where(Astronaut.callsign == data.callsign)):
        raise HTTPException(409, "Callsign already exists")
    person = Astronaut(**data.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@app.put("/api/astronauts/{person_id}", response_model=AstronautOut)
def edit_astronaut(person_id: int, data: AstronautInput, db: Session = Depends(get_db), _: None = Depends(lambda x_demo_role=Header(default="astronaut"): role_guard("admin", x_demo_role))):
    person = person_or_404(db, person_id)
    for key, value in data.model_dump().items():
        setattr(person, key, value)
    db.commit()
    return person


@app.delete("/api/astronauts/{person_id}", status_code=204)
def delete_astronaut(person_id: int, db: Session = Depends(get_db), _: None = Depends(lambda x_demo_role=Header(default="astronaut"): role_guard("admin", x_demo_role))):
    person = person_or_404(db, person_id)
    person.active = False
    db.commit()
    return Response(status_code=204)


@app.get("/api/astronauts/{person_id}/metrics")
def metrics(person_id: int, days: int = 30, db: Session = Depends(get_db)):
    person_or_404(db, person_id)
    if not 1 <= days <= 10000:
        raise HTTPException(422, "days must be between 1 and 10000")
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = db.scalars(select(Metric).where(Metric.astronaut_id == person_id, Metric.sampled_at >= since).order_by(Metric.sampled_at)).all()
    return [{"id": row.id, "key": row.key, "value": row.value, "unit": row.unit, "source": row.source, "sampled_at": row.sampled_at} for row in rows]


@app.post("/api/astronauts/{person_id}/metrics")
def add_metric(person_id: int, data: MetricInput, db: Session = Depends(get_db), _: None = Depends(lambda x_demo_role=Header(default="astronaut"): role_guard("admin", x_demo_role))):
    person_or_404(db, person_id)
    row = Metric(astronaut_id=person_id, source="manual demo entry", **data.model_dump())
    db.add(row)
    db.commit()
    return {"id": row.id}


@app.get("/api/astronauts/{person_id}/checkins")
def checkins(person_id: int, db: Session = Depends(get_db)):
    person_or_404(db, person_id)
    rows = db.scalars(select(MentalCheckin).where(MentalCheckin.astronaut_id == person_id).order_by(MentalCheckin.created_at.desc())).all()
    return [{"id": r.id, "mood": r.mood, "focus": r.focus, "stress": r.stress, "isolation": r.isolation, "sleep": r.sleep, "comment": r.comment, "created_at": r.created_at} for r in rows]


@app.post("/api/astronauts/{person_id}/checkins")
def add_checkin(person_id: int, data: CheckinInput, idempotency_key: str | None = Header(default=None), db: Session = Depends(get_db)):
    person_or_404(db, person_id)
    if idempotency_key:
        previous = db.scalar(select(MentalCheckin).where(MentalCheckin.client_operation_id == idempotency_key))
        if previous:
            if previous.astronaut_id != person_id:
                raise HTTPException(409, "Operation belongs to another astronaut")
            return {"id": previous.id, "created_at": previous.created_at, "replayed": True}
    row = MentalCheckin(astronaut_id=person_id, client_operation_id=idempotency_key, **data.model_dump())
    db.add(row)
    db.add(MissionEvent(title="Wellness check-in recorded", detail="Self-reported demonstration check-in.", kind="checkin"))
    db.commit()
    return {"id": row.id, "created_at": row.created_at}


@app.get("/api/notifications")
def notifications(db: Session = Depends(get_db)):
    rows = db.scalars(select(Notification).order_by(Notification.created_at.desc())).all()
    return [{"id": r.id, "level": r.level, "title": r.title, "detail": r.detail, "read": r.read, "created_at": r.created_at} for r in rows]


@app.patch("/api/notifications/{notification_id}/read")
def read_notification(notification_id: int, db: Session = Depends(get_db)):
    row = db.get(Notification, notification_id)
    if not row:
        raise HTTPException(404, "Notification not found")
    row.read = True
    db.commit()
    return {"id": row.id, "read": True}


@app.get("/api/timeline")
def timeline(db: Session = Depends(get_db)):
    rows = db.scalars(select(MissionEvent).order_by(MissionEvent.occurred_at.desc())).all()
    return [{"id": r.id, "title": r.title, "detail": r.detail, "kind": r.kind, "occurred_at": r.occurred_at} for r in rows]


@app.post("/api/timeline")
def add_timeline_event(body: MissionEventInput, db: Session = Depends(get_db)):
    ev = MissionEvent(
        title=body.title.strip(),
        detail=body.detail.strip(),
        kind=body.kind.strip().lower(),
        occurred_at=datetime.now(timezone.utc),
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return {"id": ev.id, "title": ev.title, "detail": ev.detail, "kind": ev.kind, "occurred_at": ev.occurred_at}


@app.get("/api/protocols")
def protocols(db: Session = Depends(get_db)):
    return [{"id": p.id, "title": p.title, "description": p.description, "source_url": p.source_url, "updated_at": p.updated_at, "steps": [{"id": s.id, "position": s.position, "text": s.text} for s in p.steps]} for p in db.scalars(select(Protocol)).all()]


@app.post("/api/protocols")
def add_protocol(data: ProtocolInput, db: Session = Depends(get_db), _: None = Depends(lambda x_demo_role=Header(default="astronaut"): role_guard("admin", x_demo_role))):
    if any(len(step.strip()) < 3 for step in data.steps):
        raise HTTPException(422, "Each step needs at least three characters")
    protocol = Protocol(title=data.title, description=data.description, source_url=data.source_url)
    protocol.steps = [ProtocolStep(position=index + 1, text=step.strip()) for index, step in enumerate(data.steps)]
    db.add(protocol)
    db.commit()
    return {"id": protocol.id}


@app.post("/api/protocols/{protocol_id}/executions")
def save_execution(protocol_id: int, astronaut_id: int, completed_steps: list[int], db: Session = Depends(get_db)):
    person_or_404(db, astronaut_id)
    protocol = db.get(Protocol, protocol_id)
    if not protocol:
        raise HTTPException(404, "Protocol not found")
    allowed = {step.id for step in protocol.steps}
    if not set(completed_steps) <= allowed:
        raise HTTPException(422, "Unknown step")
    execution = ProtocolExecution(protocol_id=protocol_id, astronaut_id=astronaut_id, completed_steps=json.dumps(completed_steps))
    db.add(execution)
    db.add(MissionEvent(title=f"Protocol checklist: {protocol.title}", detail=f"{len(completed_steps)} of {len(allowed)} steps completed", kind="protocol"))
    db.commit()
    return {"id": execution.id}


@app.get("/api/protocols/{protocol_id}/executions")
def protocol_executions(protocol_id: int, astronaut_id: int, db: Session = Depends(get_db)):
    person_or_404(db, astronaut_id)
    if not db.get(Protocol, protocol_id):
        raise HTTPException(404, "Protocol not found")
    rows = db.scalars(select(ProtocolExecution).where(ProtocolExecution.protocol_id == protocol_id, ProtocolExecution.astronaut_id == astronaut_id).order_by(ProtocolExecution.updated_at.desc())).all()
    return [{"id": row.id, "completed_steps": json.loads(row.completed_steps), "updated_at": row.updated_at} for row in rows]


def report_data(db: Session, person_id: int, days: int):
    person = person_or_404(db, person_id)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    previous_since = since - timedelta(days=days)
    rows = db.scalars(select(Metric).where(Metric.astronaut_id == person_id, Metric.sampled_at >= since).order_by(Metric.sampled_at)).all()
    previous_rows = db.scalars(select(Metric).where(Metric.astronaut_id == person_id, Metric.sampled_at >= previous_since, Metric.sampled_at < since)).all()
    grouped: dict[str, list[float]] = {}
    previous: dict[str, list[float]] = {}
    units: dict[str, str] = {}
    for row in rows:
        grouped.setdefault(row.key, []).append(row.value)
        units[row.key] = row.unit
    for row in previous_rows:
        previous.setdefault(row.key, []).append(row.value)
    checks = db.scalars(select(MentalCheckin).where(MentalCheckin.astronaut_id == person_id, MentalCheckin.created_at >= since)).all()
    notifications_count = db.scalar(select(func.count(Notification.id)).where(Notification.created_at >= since, (Notification.astronaut_id == person_id) | (Notification.astronaut_id.is_(None)))) or 0
    crew_count = db.scalar(select(func.count(Astronaut.id)).where(Astronaut.mission_id == person.mission_id, Astronaut.active)) or 0
    summary = {}
    for key, values in grouped.items():
        old_mean = mean(previous[key]) if previous.get(key) else None
        summary[key] = {"mean": round(mean(values), 2), "min": min(values), "max": max(values), "count": len(values), "unit": units[key], "change_vs_previous": round(mean(values) - old_mean, 2) if old_mean is not None else None}
    return {
        "astronaut": person.name,
        "period_days": days,
        "generated_at": datetime.now(timezone.utc),
        "provenance": "synthetic demo and manual demo entries",
        "metrics": summary,
        "series": [{"key": row.key, "value": row.value, "sampled_at": row.sampled_at} for row in rows],
        "checkins": {"count": len(checks), "mean_mood": round(mean(c.mood for c in checks), 2) if checks else None, "mean_stress": round(mean(c.stress for c in checks), 2) if checks else None},
        "notifications_count": notifications_count,
        "crew_count": crew_count,
    }


@app.get("/api/reports/{person_id}")
def report(person_id: int, days: int = 7, db: Session = Depends(get_db)):
    if not 1 <= days <= 10000:
        raise HTTPException(422, "Invalid period")
    return report_data(db, person_id, days)


@app.get("/api/reports/{person_id}/pdf")
def report_pdf(person_id: int, days: int = 7, db: Session = Depends(get_db)):
    data = report(person_id, days, db)
    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    pdf.setTitle("CosmoHealthX demo health report")
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawString(48, 790, "CosmoHealthX | Demo Health Report")
    pdf.setFont("Helvetica", 11)
    pdf.drawString(48, 765, f"Astronaut: {data['astronaut']} | Period: {days} days")
    pdf.drawString(48, 748, "Synthetic demonstration data. Not for clinical use.")
    pdf.drawString(48, 731, f"Crew: {data['crew_count']} | Notifications in period: {data['notifications_count']}")
    y = 716
    for key, item in data["metrics"].items():
        delta = item["change_vs_previous"]
        comparison = f" | change {delta:+g}" if delta is not None else " | no previous period"
        pdf.drawString(48, y, f"{key}: mean {item['mean']} {item['unit']} | min {item['min']} | max {item['max']} | n={item['count']}{comparison}")
        y -= 22
    pdf.drawString(48, 408, f"Check-ins: {data['checkins']['count']} | Mean mood: {data['checkins']['mean_mood'] or 'n/a'} | Mean stress: {data['checkins']['mean_stress'] or 'n/a'}")
    values = [point["value"] for point in data["series"] if point["key"] == "heart_rate"]
    if values:
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(48, 370, "Heart rate observations (bpm)")
        pdf.setStrokeColorRGB(0.15, 0.45, 0.55)
        pdf.line(48, 170, 548, 170)
        pdf.line(48, 170, 48, 340)
        low, high = min(values), max(values)
        span = high - low or 1
        pdf.setStrokeColorRGB(0.05, 0.65, 0.78)
        for index in range(1, len(values)):
            x1 = 48 + (index - 1) * 500 / max(1, len(values) - 1)
            x2 = 48 + index * 500 / max(1, len(values) - 1)
            y1 = 180 + (values[index - 1] - low) * 150 / span
            y2 = 180 + (values[index] - low) * 150 / span
            pdf.line(x1, y1, x2, y2)
        pdf.setFont("Helvetica", 9)
        pdf.drawString(48, 152, f"Min {low:g} bpm")
        pdf.drawRightString(548, 152, f"Max {high:g} bpm")
    pdf.save()
    return Response(buffer.getvalue(), media_type="application/pdf", headers={"Content-Disposition": 'attachment; filename="cosmohealthx-report.pdf"'})


@app.post("/api/ai/analyze")
async def analyze(data: AIInput, db: Session = Depends(get_db)):
    person_or_404(db, data.astronaut_id)
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise HTTPException(503, "Gemini is not configured. Set GEMINI_API_KEY on the server.")
    recent = db.scalars(select(Metric).where(Metric.astronaut_id == data.astronaut_id).order_by(Metric.sampled_at.desc()).limit(80)).all()
    checkins = db.scalars(select(MentalCheckin).where(MentalCheckin.astronaut_id == data.astronaut_id).order_by(MentalCheckin.created_at.desc()).limit(10)).all()
    context = {"metrics": [{"key": r.key, "value": r.value, "unit": r.unit, "sampled_at": str(r.sampled_at), "source": r.source} for r in recent], "checkins": [{"mood": c.mood, "stress": c.stress, "created_at": str(c.created_at)} for c in checkins]}
    prompt = "You are a non-clinical mission health data explainer. Use only supplied synthetic demo data. State metrics, period, uncertainty and limits. Do not diagnose or prescribe. Answer the user's question. Data: " + json.dumps(context) + " Question: " + data.question
    model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent", headers={"x-goog-api-key": key}, json={"contents": [{"parts": [{"text": prompt}]}]})
            response.raise_for_status()
            answer = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except (httpx.HTTPError, KeyError, IndexError) as exc:
        raise HTTPException(503, "Gemini is unavailable. Please try again later.") from exc
    return {"answer": answer, "records_used": len(recent), "data_provenance": "synthetic demo"}


@app.get("/api/evidence")
def evidence():
    return [
        {"title": "Human Research Program", "organization": "NASA", "url": "https://www.nasa.gov/hrp/", "description": "Program overview for human health and performance research in space.", "used_for": "Research context"},
        {"title": "Open Science Data Repository", "organization": "NASA", "url": "https://osdr.nasa.gov/", "description": "Public research data catalog; it is not live astronaut telemetry.", "used_for": "Dataset discovery"},
        {"title": "GeneLab", "organization": "NASA", "url": "https://genelab.nasa.gov/", "description": "Space biology omics research resource.", "used_for": "Scientific background"},
    ]
