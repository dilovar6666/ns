# Deployment

`docker compose up --build` starts PostgreSQL, FastAPI, and Vite for a **local demo**. The backend container runs Alembic migrations before the API starts. Copy `.env.example` to `.env` and set `POSTGRES_PASSWORD` and optional `GEMINI_API_KEY`.

Do not expose the current app publicly: demo role headers are forgeable, no real identity exists, and the astronaut model's redistribution license is unknown. Public deployment additionally requires TLS, real authentication/authorization, secrets management, database backups, asset license verification, rate limiting, monitoring, and privacy review. The Vite container is a development server, not production hosting.
