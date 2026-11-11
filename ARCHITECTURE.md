# Architecture

```mermaid
flowchart LR
    UI[React + Vite] --> API[FastAPI REST]
    UI --> GLB[Astronaut GLB]
    API --> DB[(PostgreSQL / local SQLite)]
    API --> Gemini[Gemini API, optional]
    API --> PDF[Deterministic report engine + PDF]
```

The frontend uses React Router for ten sections and TanStack Query for server state. The backend owns stored observations, check-ins, and report calculations. Gemini receives a bounded slice of recent records and cannot alter report values. Demo seed records are synthetic and their provenance is stored on every metric.

The service worker only caches the app shell and fetched static assets. API GET and POST calls require the backend. The 3D scene lazy-loads the supplied GLB; it currently has one suit mode. Anatomy systems need separate licensed assets.

The current role header is explicitly a demo control and provides no real security. See README before any public deployment.
