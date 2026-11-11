# CosmoHealthX

CosmoHealthX is a **synthetic-data demonstration** of mission health monitoring for the NASA Space Apps Challenge theme “Create Health Monitoring Software for Astronauts on Space Missions.” It is not a medical device and contains no real astronaut health records.

## What runs now

- React/Vite dashboard, crew management, 12 metric histories, mental check-ins, breathing timer, notification center, timeline, evidence links, reports, and an interactive astronaut GLB viewer.
- FastAPI with SQLAlchemy, PostgreSQL support, Alembic schema, seeded demo records, calculated report JSON/PDF, and optional server-side Gemini analysis.
- English and Russian navigation and selected interface labels. Some detailed interface text remains English.
- Service worker app-shell caching and a manifest icon. Offline data storage, mutation queue, and conflict resolution are not implemented.

## Run locally

### Docker Compose (PostgreSQL)

```sh
docker compose up --build
```

Open <http://localhost:5173>. API docs: <http://localhost:8000/docs>.

### Without Docker

Create a Python virtual environment and install `backend/requirements.txt`. In `backend/`, run `python -m alembic upgrade head`, then from the repository root run `python -m uvicorn app.main:app --app-dir backend --reload`. In another terminal run `npm ci --prefix frontend` and `npm run dev --prefix frontend`. The local backend defaults to SQLite for easy evaluation; Compose uses PostgreSQL.

Set `GEMINI_API_KEY` only in the backend environment to enable AI. Without it, the assistant returns a clear unavailable message. The model ID can be set with `GEMINI_MODEL`; verify it against your Gemini account.

## Tests

```sh
cd backend && python -m pytest tests -q
npm run build --prefix frontend
```

## Security and data limitations

The profile and role selectors are **demo controls, not authentication**. Anyone who can reach this API can select the demo admin role in a request. Do not expose this deployment to untrusted users or store personal health data. Production use requires an identity provider, server-verified claims, authorization for each astronaut record, audit logging, and a privacy review.

Every seed observation is labeled `simulated demo` and timestamped. Reports calculate descriptive statistics from stored observations. No clinical thresholds or diagnoses are supplied.

The supplied astronaut asset lacks a license document. Confirm permission before redistribution or public deployment. See [3D_ASSETS.md](./3D_ASSETS.md) and [AUDIT.md](./AUDIT.md).

## Project documents

[Architecture](./ARCHITECTURE.md) · [Database](./DATABASE.md) · [API](./API.md) · [3D assets](./3D_ASSETS.md) · [Blender workflow](./BLENDER_WORKFLOW.md) · [Scientific sources](./SCIENTIFIC_SOURCES.md) · [Demo guide](./DEMO_GUIDE.md) · [Deployment](./DEPLOYMENT.md)
