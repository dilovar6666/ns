import io
import json
import os
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
from .models import Astronaut, MentalCheckin, Metric, Mission, MissionEvent, Notification, Protocol, ProtocolExecution, ProtocolStep
from .schemas import AIInput, AstronautInput, AstronautOut, CheckinInput, MetricInput
from .seed import seed


app = FastAPI(title="CosmoHealthX demo API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").split(","), allow_methods=["*"], allow_headers=["*"])


@app.on_event("startup")
def startup():
    Base.metadata.create_all(engine)
    with next(get_db()) as db:
        seed(db)


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
def add_checkin(person_id: int, data: CheckinInput, db: Session = Depends(get_db)):
    person_or_404(db, person_id)
    row = MentalCheckin(astronaut_id=person_id, **data.model_dump())
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


@app.get("/api/protocols")
def protocols(db: Session = Depends(get_db)):
    return [{"id": p.id, "title": p.title, "description": p.description, "source_url": p.source_url, "updated_at": p.updated_at, "steps": [{"id": s.id, "position": s.position, "text": s.text} for s in p.steps]} for p in db.scalars(select(Protocol)).all()]


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


def report_data(db: Session, person_id: int, days: int):
    person = person_or_404(db, person_id)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    rows = db.scalars(select(Metric).where(Metric.astronaut_id == person_id, Metric.sampled_at >= since)).all()
    grouped: dict[str, list[float]] = {}
    units: dict[str, str] = {}
    for row in rows:
        grouped.setdefault(row.key, []).append(row.value)
        units[row.key] = row.unit
    checks = db.scalars(select(MentalCheckin).where(MentalCheckin.astronaut_id == person_id, MentalCheckin.created_at >= since)).all()
    return {"astronaut": person.name, "period_days": days, "generated_at": datetime.now(timezone.utc), "provenance": "synthetic demo and manual demo entries", "metrics": {key: {"mean": round(mean(values), 2), "min": min(values), "max": max(values), "count": len(values), "unit": units[key]} for key, values in grouped.items()}, "checkins": {"count": len(checks), "mean_mood": round(mean(c.mood for c in checks), 2) if checks else None, "mean_stress": round(mean(c.stress for c in checks), 2) if checks else None}}


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
    y = 716
    for key, item in data["metrics"].items():
        pdf.drawString(48, y, f"{key}: mean {item['mean']} {item['unit']}  |  min {item['min']}  |  max {item['max']}  |  n={item['count']}")
        y -= 22
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
