"""Integration tests for the FastAPI endpoints."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

os.environ["DATABASE_URL"] = "sqlite:///./test_context_aware.db"

import pytest
from fastapi.testclient import TestClient
from main import app
from database import init_db, engine, Base

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Create tables before each test and drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_create_session_random_context():
    resp = client.post("/sessions/create", json={})
    assert resp.status_code == 200
    data = resp.json()
    assert "participant_id" in data
    assert "session_token" in data
    assert "session_id" in data
    assert "context_profile" in data
    assert "network" in data["context_profile"]


def test_create_session_explicit_context():
    resp = client.post("/sessions/create", json={
        "context_profile": {
            "network": "PUBLIC_WIFI",
            "device": "NEW_DEVICE",
            "time_slot": "OFF_HOURS",
            "behavioral_anomaly_score": 0.8,
        }
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["context_profile"]["network"] == "PUBLIC_WIFI"


def test_list_session_scenarios():
    # Create session first
    resp = client.post("/sessions/create", json={})
    session_id = resp.json()["session_id"]

    resp2 = client.get(f"/scenarios/session/{session_id}")
    assert resp2.status_code == 200
    scenarios = resp2.json()
    assert len(scenarios) == 5
    types = {s["scenario_type"] for s in scenarios}
    assert types == {"PHISHING", "NEW_DEVICE", "FILE_SHARE", "WIFI_ACCESS", "UNUSUAL_DOWNLOAD"}


def test_get_next_scenario():
    resp = client.post("/sessions/create", json={})
    session_id = resp.json()["session_id"]

    resp2 = client.get(f"/scenarios/session/{session_id}/next")
    assert resp2.status_code == 200
    scenario = resp2.json()
    assert "risk_score" in scenario
    assert "warning_level" in scenario


def test_complete_scenario():
    resp = client.post("/sessions/create", json={})
    session_id = resp.json()["session_id"]

    next_resp = client.get(f"/scenarios/session/{session_id}/next")
    run_id = next_resp.json()["id"]

    complete_resp = client.post(f"/scenarios/{run_id}/complete", json={"outcome": "COMPLETED_SAFE"})
    assert complete_resp.status_code == 200
    assert complete_resp.json()["outcome"] == "COMPLETED_SAFE"


def test_record_event():
    resp = client.post("/sessions/create", json={})
    session_id = resp.json()["session_id"]
    next_resp = client.get(f"/scenarios/session/{session_id}/next")
    run_id = next_resp.json()["id"]

    event_resp = client.post("/scenarios/events", json={
        "scenario_run_id": run_id,
        "session_id": session_id,
        "event_type": "WARNING_SHOWN",
        "duration_ms": None,
    })
    assert event_resp.status_code == 201


def test_post_scenario_survey():
    resp = client.post("/sessions/create", json={})
    session_id = resp.json()["session_id"]
    next_resp = client.get(f"/scenarios/session/{session_id}/next")
    run_id = next_resp.json()["id"]

    survey_resp = client.post("/surveys/post-scenario", json={
        "scenario_run_id": run_id,
        "session_id": session_id,
        "perceived_friction": 4,
        "trust_score": 5,
        "warning_helpful": True,
    })
    assert survey_resp.status_code == 201


def test_nasa_tlx():
    resp = client.post("/sessions/create", json={})
    session_id = resp.json()["session_id"]

    tlx_resp = client.post("/surveys/nasa-tlx", json={
        "session_id": session_id,
        "mental_demand": 60,
        "physical_demand": 10,
        "temporal_demand": 50,
        "performance": 70,
        "effort": 55,
        "frustration": 30,
    })
    assert tlx_resp.status_code == 201
    assert "tlx_score" in tlx_resp.json()


def test_dashboard_metrics():
    resp = client.get("/dashboard/metrics")
    assert resp.status_code == 200
    data = resp.json()
    assert "security" in data
    assert "human_centered" in data
    assert "behavioral" in data


def test_dashboard_by_scenario():
    resp = client.get("/dashboard/metrics/by-scenario")
    assert resp.status_code == 200
    data = resp.json()
    assert "PHISHING" in data


def test_export_scenario_runs_csv():
    resp = client.get("/dashboard/export/scenario-runs")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
