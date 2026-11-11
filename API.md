# API overview

FastAPI interactive schema: `/docs`. Paths are prefixed with `/api`.

| Endpoint | Purpose |
|---|---|
| `GET /status` | Demo and provenance status |
| `GET /missions`, `GET /astronauts` | Mission and active crew |
| `POST/PUT/DELETE /astronauts` | Demo admin crew management |
| `GET/POST /astronauts/{id}/metrics` | History and demo admin manual entry |
| `GET/POST /astronauts/{id}/checkins` | Mental check-in history and entry |
| `GET/PATCH /notifications` | Notification list and read state |
| `GET /timeline`, `GET /protocols` | Stored events and reviewed protocol catalog |
| `POST /protocols/{id}/executions` | Save checklist progress |
| `GET /reports/{id}`, `GET /reports/{id}/pdf` | Calculated report and PDF |
| `POST /ai/analyze` | Optional Gemini interpretation |
| `GET /evidence` | Official research resource links |

Mutations for crew and manual metrics require `X-Demo-Role: admin`. This header is forgeable and is **not authentication**. The service must remain local or otherwise protected until real authorization is implemented.

`POST /astronauts/{id}/checkins` accepts `Idempotency-Key` for offline replay. Repeating the same key returns the original record; using it for a different astronaut returns 409.
