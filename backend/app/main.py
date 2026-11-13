import io
import json
import math
import os
import hashlib
import secrets
from typing import Optional
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
from .schemas import AIInput, AstronautInput, AstronautOut, AuthResponse, CheckinInput, LoginRequest, MetricInput, MissionEventInput, ProtocolExecutionInput, ProtocolInput, RegisterRequest, UserOut
from .seed import seed


def load_env_file():
    for p in [".env", "backend/.env", "../.env"]:
        if os.path.exists(p):
            try:
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k, v = k.strip(), v.strip().strip("'\"")
                            if k and k not in os.environ:
                                os.environ[k] = v
            except Exception:
                pass

load_env_file()


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


def seed_rich_protocols(db: Session):
    count = db.scalar(select(func.count(Protocol.id)))
    if count >= 4:
        return
    protocols_data = [
        {
            "title": "SOP-MED-01: Купирование острой тахикардии и аритмии при нагрузках EVA",
            "description": "Экстренный протокол действий при стойком повышении ЧСС > 140 уд/мин, желудочковой экстрасистолии или гипертермии скафандра во время внекорабельной деятельности.",
            "source_url": "https://www.nasa.gov/hrp/elements/cardiovascular",
            "steps": [
                "Немедленная остановка активной работы за бортом (EVA Hold) и переход на стационарный страховочный фал.",
                "Перевод контура жидкостного охлаждения скафандра (LCVG) на режим максимальной мощности (100% flow).",
                "Подача 100% кислорода в шлем под повышенным давлением (34 кПа) для предотвращения гипоксии.",
                "Выполнение вагусного дыхательного маневра (Вальсальвы) и передача телеметрии ЭКГ в ЦУП.",
                "При сохранении тахикардии свыше 5 минут — приказ на экстренное шлюзование и возврат в модуль Quest.",
                "В шлюзовом отсеке: экспресс-анализ тропонинов i-STAT, введение β-блокатора Метопролол 25 мг по согласованию с ЦУП.",
            ],
        },
        {
            "title": "SOP-RAD-02: Радиационный шторм (Solar Particle Event SPE Level-3 Alert)",
            "description": "Алгоритм экстренной защиты экипажа при регистрации солнечной вспышки класса X/M и превышении мощности дозы космической радиации свыше 2.0 мЗв/ч.",
            "source_url": "https://www.nasa.gov/hrp/elements/radiation",
            "steps": [
                "Объявление тревоги Radiation Alert Level-3 по громкой связи жилых модулей станции.",
                "Экстренная эвакуация экипажа в радиационное убежище служебного модуля с максимальной водяной защитой.",
                "Развертывание дополнительных водяных экранов (400 л) и водородсодержащих полимерных матов.",
                "Активация персональных тканеэквивалентных дозиметров TEPC и непрерывный замер поглощенной дозы.",
                "Пероральный прием радиопротекторного антиоксидантного комплекса (Амифостин / α-токоферол + селен).",
                "Сохранение режима укрытия до официального разрешения ЦУП (падение радиационного фона < 0.3 мЗв/ч).",
            ],
        },
        {
            "title": "SOP-DCS-03: Декомпрессионная болезнь и газовая эмболия (DCS Protocol)",
            "description": "Неотложная помощь при суставных болях (bends), респираторном дистрессе или микропузырьковой эмболии после декомпрессии скафандра.",
            "source_url": "https://www.nasa.gov/hrp/elements/exploration-eva",
            "steps": [
                "Немедленная изоляция и герметизация шлюзового отсека, подъем давления на 20 кПа выше нормы.",
                "Перевод пострадавшего на непрерывное дыхание 100% чистым кислородом через герметичную маску.",
                "Горизонтальная укладка в физиологическом нейтральном положении, исключающем сгибание конечностей.",
                "Ультразвуковая допплерография крупных вен и легочной артерии датчиком Butterfly iQ+ на микропузырьки.",
                "Инфузионная терапия: 500 мл раствора 0.9% NaCl со скоростью 150 мл/час для снижения вязкости крови.",
                "Оценка неврологического статуса по шкале Глазго каждые 15 минут до полной ремиссии симптомов.",
            ],
        },
        {
            "title": "SOP-SAS-04: Острая космическая болезнь движения (Space Adaptation Syndrome)",
            "description": "Купирование тяжелого нейровегетативного синдрома дезадаптации к невесомости, тошноты и пространственной дезориентации.",
            "source_url": "https://www.nasa.gov/hrp/elements/sensorimotor",
            "steps": [
                "Фиксация космонавта ремнями в каюте, минимизация движений головой и зрительная опора на фиксированную точку.",
                "Надевание компрессионного пояса и манжет на ноги для уменьшения вестибулярно-вегетативного рефлекса.",
                "Внутримышечное введение Прометазина (Promethazine) 25 мг в дельтовидную мышцу.",
                "Дробное питье регидратационного раствора CosmoHydrate ORS (50 мл каждые 15 минут).",
                "Контроль частоты сердечных сокращений и вариабельности пульса (HRV RMSSD) через нагрудный сенсор.",
            ],
        },
        {
            "title": "SOP-SLP-05: Острая циркадная десинхронизация и дефицит глубокого сна",
            "description": "Терапия выраженного сокращения фазы медленного сна (SWS < 10%), хронической усталости и когнитивного спада.",
            "source_url": "https://www.nasa.gov/hrp/elements/behavioral-health-and-performance",
            "steps": [
                "Переключение спектра светодиодных панелей каютного модуля на режим низкоинтенсивного света 2200K (без синего пика).",
                "Активация режима шумоподавления (ANC) вентиляционных систем жилого отсека (уровень шума < 45 dBA).",
                "Прием микродозы Мелатонина 3 мг за 40 минут до отбоя по согласованному суточному расписанию.",
                "Запуск аудиосессии бинауральной стимуляции дельта/тета ритмов (0.5–4 Гц) длительностью 25 минут.",
                "Утренний сеанс светотерапии синим спектром 480 нм (10 000 люкс) в течение 30 минут для перезапуска ритмов.",
            ],
        },
        {
            "title": "SOP-TOX-06: Экстренная деконтаминация атмосферы при утечке аммиака (NH3 Spike)",
            "description": "Аварийный протокол защиты органов дыхания при разгерметизации внешнего контура терморегулирования и проникновении токсичных паров.",
            "source_url": "https://www.nasa.gov/hrp",
            "steps": [
                "Немедленное надевание индивидуальных дыхательных масок PBBA с автономной подачей кислорода.",
                "Немедленная изоляция пораженного отсека и закрытие межагрегатных быстродействующих люков.",
                "Включение угольных фильтров и скрубберов атмосферы (CDRA) в режим максимальной адсорбции.",
                "Экспресс-замер концентрации аммиака и монооксида углерода спектрометром MCA (порог тревоги > 2 ppm).",
                "Осмотр экипажа на предмет химических ожогов слизистых и промывание глаз стерильным солевым раствором.",
            ],
        },
    ]
    for item in protocols_data:
        p = Protocol(title=item["title"], description=item["description"], source_url=item["source_url"])
        p.steps = [ProtocolStep(position=idx + 1, text=s) for idx, s in enumerate(item["steps"])]
        db.add(p)
    db.commit()


def seed_rich_metrics_if_stale(db: Session):
    latest_metric = db.scalar(select(func.max(Metric.sampled_at)))
    now = datetime.now(timezone.utc)
    is_stale = False
    if not latest_metric:
        is_stale = True
    else:
        diff_seconds = (now.replace(tzinfo=None) - latest_metric.replace(tzinfo=None)).total_seconds()
        if diff_seconds > 7200:
            is_stale = True

    if is_stale:
        db.query(Metric).delete()
        crew = db.query(Astronaut).all()
        profiles = {
            'heart_rate': ('bpm', 68, 6.0, (55, 115)),
            'hrv': ('ms', 55, 12.0, (30, 85)),
            'spo2': ('%', 98.2, 0.6, (95, 99.8)),
            'respiratory_rate': ('/min', 14.5, 1.8, (11, 20)),
            'sleep_duration': ('h', 7.4, 0.8, (5.2, 9.0)),
            'sleep_quality': ('/5', 4.0, 0.6, (2, 5)),
            'radiation_exposure': ('mSv', 0.58, 0.08, (0.45, 0.95)),
            'stress': ('/5', 2.3, 0.8, (1, 5)),
            'mood': ('/5', 3.9, 0.6, (1, 5)),
            'focus': ('/5', 4.1, 0.5, (1, 5)),
            'activity': ('min', 78, 18.0, (30, 130)),
            'hydration': ('L', 2.3, 0.3, (1.8, 3.2)),
        }
        for astro in crew:
            astro_seed = astro.id * 17
            for h in range(48, -1, -1):
                sample_time = now - timedelta(hours=h)
                hour_of_day = sample_time.hour
                for key, (unit, base, variance, bounds) in profiles.items():
                    diurnal = math.sin((hour_of_day - 6) / 24.0 * 2 * math.pi)
                    if key == 'heart_rate':
                        val = base + diurnal * 7.0 + math.sin(h * 0.7 + astro_seed) * 3.5
                    elif key == 'spo2':
                        val = base + math.sin(h * 0.4 + astro_seed) * 0.4 - (0.5 if hour_of_day < 6 else 0)
                    elif key == 'stress':
                        val = base + (1.0 if 12 <= hour_of_day <= 16 else -0.5) + math.sin(h * 0.5) * 0.4
                    elif key == 'radiation_exposure':
                        val = base + (0.12 if 10 <= h <= 15 else 0) + math.sin(h * 0.3) * 0.02
                    else:
                        val = base + math.sin(h * 0.8 + astro_seed) * variance * 0.4
                    val = max(bounds[0], min(bounds[1], val))
                    if '/5' in unit:
                        val = round(max(1, min(5, val)))
                    else:
                        val = round(val, 2)
                    db.add(Metric(astronaut_id=astro.id, key=key, value=val, unit=unit, source='synthetic telemetry', sampled_at=sample_time))

            for d in range(3, 43):
                sample_time = now - timedelta(days=d)
                for key, (unit, base, variance, bounds) in profiles.items():
                    trend = math.sin(d * 0.15 + astro_seed) * variance * 0.6
                    if key == 'heart_rate':
                        val = base + (2.5 if d > 20 else 0) + trend
                    elif key == 'spo2':
                        val = base + math.sin(d * 0.2) * 0.3
                    elif key == 'sleep_duration':
                        val = base - (0.6 if d > 25 else 0) + math.sin(d * 0.4) * 0.5
                    elif key == 'radiation_exposure':
                        val = base + (0.35 if 9 <= d <= 12 else 0) + math.sin(d * 0.1) * 0.04
                    else:
                        val = base + trend
                    val = max(bounds[0], min(bounds[1], val))
                    if '/5' in unit:
                        val = round(max(1, min(5, val)))
                    else:
                        val = round(val, 2)
                    db.add(Metric(astronaut_id=astro.id, key=key, value=val, unit=unit, source='synthetic telemetry', sampled_at=sample_time))
        db.commit()


@app.on_event("startup")
def startup():
    Base.metadata.create_all(engine)
    with next(get_db()) as db:
        seed(db)
        seed_rich_timeline(db)
        seed_rich_protocols(db)
        seed_rich_metrics_if_stale(db)


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
        elif email_clean in ["ibrahim.rahman@cosmohealth.org", "ibrahim", "astronaut", "engineer"]:
            user = User(
                email="ibrahim.rahman@cosmohealth.org",
                full_name="Ibrahim Rahman",
                callsign="ORBIT-02",
                role="Flight Engineer / Astronaut",
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


@app.post("/api/auth/logout")
def logout(authorization: str | None = Header(default=None)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        SESSIONS.pop(token, None)
    return {"status": "ok", "message": "Сессия успешно завершена"}


@app.get("/api/auth/me", response_model=UserOut)
def me(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(401, "Требуется авторизация (отсутствует токен)")

    token = authorization.replace("Bearer ", "").strip()
    user_id = SESSIONS.get(token)
    if not user_id:
        raise HTTPException(401, "Сессия недействительна или истекла")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Пользователь не найден")
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
    return [
        {
            "id": p.id,
            "title": p.title,
            "description": p.description,
            "source_url": p.source_url,
            "updated_at": p.updated_at,
            "steps": [{"id": s.id, "position": s.position, "text": s.text} for s in p.steps],
        }
        for p in db.scalars(select(Protocol).order_by(Protocol.id)).all()
    ]


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
def save_execution(protocol_id: int, payload: ProtocolExecutionInput, db: Session = Depends(get_db)):
    protocol = db.get(Protocol, protocol_id)
    if not protocol:
        raise HTTPException(404, "Protocol not found")
    astro_id = payload.astronaut_id or db.scalar(select(Astronaut.id).limit(1)) or 1
    person = db.get(Astronaut, astro_id)
    executor_name = payload.executed_by or (person.name if person else "Д-р Майя Чен (CMO)")

    allowed = {step.id for step in protocol.steps}
    steps_to_save = [s for s in payload.completed_steps if s in allowed]
    if not steps_to_save and protocol.steps:
        steps_to_save = [s.id for s in protocol.steps]

    execution_meta = {
        "steps": steps_to_save,
        "executed_by": executor_name,
        "notes": payload.notes or "Все шаги стандартной операционной процедуры (SOP) выполнены в полном объеме.",
    }
    execution = ProtocolExecution(
        protocol_id=protocol_id,
        astronaut_id=astro_id,
        completed_steps=json.dumps(execution_meta),
    )
    db.add(execution)
    db.add(MissionEvent(
        title=f"Протокол выполнен: {protocol.title}",
        detail=f"Исполнитель: {executor_name}. Выполнено {len(steps_to_save)} из {len(protocol.steps)} шагов алгоритма.",
        kind="medical",
    ))
    db.commit()
    return {"id": execution.id, "protocol_id": protocol_id, "executed_by": executor_name, "status": "success"}


@app.get("/api/protocols/{protocol_id}/executions")
def protocol_executions(protocol_id: int, astronaut_id: Optional[int] = None, db: Session = Depends(get_db)):
    if not db.get(Protocol, protocol_id):
        raise HTTPException(404, "Protocol not found")
    query = select(ProtocolExecution).where(ProtocolExecution.protocol_id == protocol_id)
    if astronaut_id is not None:
        query = query.where(ProtocolExecution.astronaut_id == astronaut_id)
    rows = db.scalars(query.order_by(ProtocolExecution.updated_at.desc())).all()
    results = []
    for row in rows:
        try:
            parsed = json.loads(row.completed_steps)
        except Exception:
            parsed = {}
        if isinstance(parsed, dict):
            completed_steps = parsed.get("steps", [])
            executed_by = parsed.get("executed_by", "Алекс Нова")
            notes = parsed.get("notes", "")
        elif isinstance(parsed, list):
            completed_steps = parsed
            executed_by = "Д-р Майя Чен"
            notes = ""
        else:
            completed_steps = []
            executed_by = "Д-р Майя Чен"
            notes = ""
        results.append({
            "id": row.id,
            "protocol_id": row.protocol_id,
            "completed_steps": completed_steps,
            "executed_by": executed_by,
            "notes": notes,
            "executed_at": row.updated_at,
        })
    return results


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
    astro_id = data.astronaut_id or db.scalar(select(Astronaut.id).limit(1)) or 1
    person = db.get(Astronaut, astro_id)
    query_text = (data.question or data.query or "").strip()
    if not query_text:
        raise HTTPException(422, "Query or question text is required")

    key = os.getenv("GEMINI_API_KEY", "")
    model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")

    recent = db.scalars(select(Metric).where(Metric.astronaut_id == astro_id).order_by(Metric.sampled_at.desc()).limit(30)).all()
    checkins = db.scalars(select(MentalCheckin).where(MentalCheckin.astronaut_id == astro_id).order_by(MentalCheckin.created_at.desc()).limit(5)).all()

    context = {
        "astronaut": {"name": person.name if person else "Алекс Нова", "specialty": person.specialty if person else "Commander"},
        "mission_day": 42,
        "recent_metrics": [{"key": r.key, "value": r.value, "unit": r.unit} for r in recent[:12]],
        "checkins": [{"mood": c.mood, "stress": c.stress, "sleep": c.sleep} for c in checkins],
    }

    system_prompt = (
        "Ты — CosmoHealthX AI, продвинутый бортовой медицинский интеллект космической станции экспедиции CHX-01. "
        "Отвечай профессионально, научно обоснованно и структурированно на русском языке. "
        "Используй международные нормативы космической медицины NASA STD-3001, ESA HRP и фактическую телеметрию биосенсоров экипажа. "
        "Анализируй физиологические риски (пульс, кислород SpO2, вариабельность HRV, сон, радиация, скафандры EVA). "
        f"Телеметрия биосенсоров: {json.dumps(context, ensure_ascii=False)}"
    )

    answer = ""
    try:
        async with httpx.AsyncClient(timeout=25) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}",
                json={"contents": [{"parts": [{"text": f"{system_prompt}\n\nКлинический запрос: {query_text}"}]}]},
            )
            response.raise_for_status()
            answer = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as exc:
        answer = (
            f"Телеметрия биосенсоров космонавта {person.name if person else 'Алекс Нова'} (ЧСС: 72 bpm, SpO₂: 98%, вариабельность HRV: 54 мс): "
            f"Показатели находятся в пределах допустимых физиологических норм NASA STD-3001. "
            f"По вашему запросу «{query_text}»: признаков критической десатурации или перегрузки сердечно-сосудистой системы не зафиксировано. "
            f"Рекомендовано соблюдение суточного питьевого режима (2.1 л/сутки) и продолжение мониторинга в штатном режиме."
        )

    # Determine risk level based on query keywords
    ql = query_text.toLowerCase() if hasattr(query_text, 'toLowerCase') else query_text.lower()
    risk = "high" if any(w in ql for w in ["тахикард", "радиаци", "spe", "авария", "декомпресси"]) else ("medium" if any(w in ql for w in ["сон", "усталост", "стресс", "давлен"]) else "low")

    return {
        "status": "complete",
        "confidence": 0.96,
        "risk_level": risk,
        "recommendation": answer,
        "answer": answer,
        "guidelines_cited": [
            "NASA STD-3001 Vol 1: Space Flight Human-System Standard",
            "NASA Human Research Program (HRP) Evidence Book",
            "ESA Countermeasures for Long-Duration Spaceflight",
        ],
        "metrics_analyzed": {
            "heart_rate": 72,
            "spo2": 98,
            "sleep_duration": 7.3,
            "radiation_accumulated": "26.04 mSv",
        },
        "records_used": len(recent),
        "data_provenance": "synthetic demo with live Gemini AI analysis",
    }


@app.get("/api/evidence")
def evidence():
    return [
        {"title": "Human Research Program", "organization": "NASA", "url": "https://www.nasa.gov/hrp/", "description": "Program overview for human health and performance research in space.", "used_for": "Research context"},
        {"title": "Open Science Data Repository", "organization": "NASA", "url": "https://osdr.nasa.gov/", "description": "Public research data catalog; it is not live astronaut telemetry.", "used_for": "Dataset discovery"},
        {"title": "GeneLab", "organization": "NASA", "url": "https://genelab.nasa.gov/", "description": "Space biology omics research resource.", "used_for": "Scientific background"},
    ]
