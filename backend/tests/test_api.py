import os

os.environ["DATABASE_URL"] = "sqlite:///./test_cosmohealthx.db"

from fastapi.testclient import TestClient

from app.main import app


def test_demo_flow():
    with TestClient(app) as client:
        status = client.get("/api/status")
        assert status.status_code == 200
        assert status.json()["data_provenance"] == "synthetic"
        crew = client.get("/api/astronauts").json()
        assert len(crew) >= 4
        person_id = crew[0]["id"]
        metrics = client.get(f"/api/astronauts/{person_id}/metrics").json()
        assert metrics and all(row["source"] == "simulated demo" for row in metrics)
        denied = client.post("/api/astronauts", json={"name": "Test User", "callsign": "TEST", "specialty": "Research", "mission_id": 1})
        assert denied.status_code == 403
        checkin = client.post(f"/api/astronauts/{person_id}/checkins", json={"mood": 4, "focus": 3, "stress": 2, "isolation": 4, "sleep": 3})
        assert checkin.status_code == 200
        payload = {"mood": 4, "focus": 3, "stress": 2, "isolation": 4, "sleep": 3}
        headers = {"Idempotency-Key": "test-offline-operation"}
        first = client.post(f"/api/astronauts/{person_id}/checkins", json=payload, headers=headers)
        replay = client.post(f"/api/astronauts/{person_id}/checkins", json=payload, headers=headers)
        assert first.status_code == 200 and replay.json()["id"] == first.json()["id"]
        assert replay.json()["replayed"] is True
        report = client.get(f"/api/reports/{person_id}?days=30")
        assert report.status_code == 200
        assert report.json()["metrics"]["heart_rate"]["count"] > 0
        assert report.json()["metrics"]["heart_rate"]["change_vs_previous"] is None
        assert report.json()["crew_count"] >= 4
        weekly = client.get(f"/api/reports/{person_id}?days=7").json()
        assert weekly["metrics"]["heart_rate"]["change_vs_previous"] is not None
        assert weekly["series"]
        protocol_data = {"title": "Demo review checklist", "description": "Non-clinical data review for API testing only.", "source_url": "https://www.nasa.gov/hrp/", "steps": ["Review available observations", "Record data limitations"]}
        assert client.post("/api/protocols", json=protocol_data).status_code == 403
        added = client.post("/api/protocols", json=protocol_data, headers={"X-Demo-Role": "admin"})
        assert added.status_code == 200
        protocol_id = added.json()["id"]
        step_id = next(p for p in client.get("/api/protocols").json() if p["id"] == protocol_id)["steps"][0]["id"]
        execution = client.post(f"/api/protocols/{protocol_id}/executions?astronaut_id={person_id}", json=[step_id])
        assert execution.status_code == 200
        history = client.get(f"/api/protocols/{protocol_id}/executions?astronaut_id={person_id}").json()
        assert history[0]["completed_steps"] == [step_id]
        pdf = client.get(f"/api/reports/{person_id}/pdf?days=30")
        assert pdf.status_code == 200 and pdf.content.startswith(b"%PDF")
        unavailable = client.post("/api/ai/analyze", json={"astronaut_id": person_id, "question": "Trend?"})
        assert unavailable.status_code == 503
