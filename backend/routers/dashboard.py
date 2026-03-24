import csv
import io
import json
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import ScenarioRun, Event, PostScenarioSurvey, NasaTLXSurvey
from models.participant import Participant, ScenarioSession
from services.metrics_service import get_all_metrics
from services.metrics_service import unsafe_action_rate

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    return get_all_metrics(db)


@router.get("/metrics/by-scenario")
def metrics_by_scenario(db: Session = Depends(get_db)):
    """Aggregate key metrics broken down by scenario type."""
    from models.scenario import ScenarioRun
    scenario_types = ["PHISHING", "NEW_DEVICE", "FILE_SHARE", "WIFI_ACCESS", "UNUSUAL_DOWNLOAD"]
    result = {}
    for stype in scenario_types:
        runs = db.query(ScenarioRun).filter(ScenarioRun.scenario_type == stype).all()
        total = len(runs)
        if total == 0:
            result[stype] = {"total": 0}
            continue
        unsafe = sum(1 for r in runs if r.outcome == "UNSAFE_ACTION")
        safe = sum(1 for r in runs if r.outcome == "COMPLETED_SAFE")
        bypassed = sum(1 for r in runs if r.outcome == "BYPASSED")
        abandoned = sum(1 for r in runs if r.outcome == "ABANDONED")
        avg_risk = round(sum(r.risk_score for r in runs) / total, 3)
        result[stype] = {
            "total": total,
            "unsafe_action_rate": round(unsafe / total, 4),
            "safe_rate": round(safe / total, 4),
            "bypass_rate": round(bypassed / total, 4),
            "abandonment_rate": round(abandoned / total, 4),
            "avg_risk_score": avg_risk,
        }
    return result


@router.get("/participants")
def list_participants(db: Session = Depends(get_db)):
    sessions = db.query(ScenarioSession).all()
    result = []
    for s in sessions:
        runs = db.query(ScenarioRun).filter(ScenarioRun.session_id == s.id).all()
        completed = sum(1 for r in runs if r.outcome is not None)
        result.append({
            "session_id": s.id,
            "participant_id": s.participant_id,
            "context_profile": s.context_profile,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "scenarios_completed": completed,
            "scenarios_total": len(runs),
            "session_unsafe_rate": unsafe_action_rate(db, session_id=s.id),
        })
    return result


@router.get("/export/scenario-runs")
def export_scenario_runs(db: Session = Depends(get_db)):
    """Export all scenario runs as CSV."""
    runs = db.query(ScenarioRun).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "session_id", "scenario_type", "scenario_order",
        "risk_score", "warning_level", "outcome", "started_at", "completed_at",
    ])
    for r in runs:
        writer.writerow([
            r.id, r.session_id, r.scenario_type, r.scenario_order,
            r.risk_score, r.warning_level, r.outcome,
            r.started_at.isoformat() if r.started_at else "",
            r.completed_at.isoformat() if r.completed_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=scenario_runs.csv"},
    )


@router.get("/export/events")
def export_events(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "scenario_run_id", "session_id", "event_type", "duration_ms", "timestamp"])
    for e in events:
        writer.writerow([
            e.id, e.scenario_run_id, e.session_id, e.event_type,
            e.duration_ms, e.timestamp.isoformat() if e.timestamp else "",
        ])
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=events.csv"},
    )


@router.get("/export/surveys")
def export_surveys(db: Session = Depends(get_db)):
    surveys = db.query(PostScenarioSurvey).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "scenario_run_id", "session_id", "perceived_friction", "trust_score", "warning_helpful", "submitted_at"])
    for s in surveys:
        writer.writerow([
            s.id, s.scenario_run_id, s.session_id,
            s.perceived_friction, s.trust_score, s.warning_helpful,
            s.submitted_at.isoformat() if s.submitted_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=post_scenario_surveys.csv"},
    )


@router.get("/export/nasa-tlx")
def export_nasa_tlx(db: Session = Depends(get_db)):
    surveys = db.query(NasaTLXSurvey).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "id", "session_id", "mental_demand", "physical_demand", "temporal_demand",
        "performance", "effort", "frustration", "tlx_score", "submitted_at",
    ])
    for s in surveys:
        writer.writerow([
            s.id, s.session_id, s.mental_demand, s.physical_demand,
            s.temporal_demand, s.performance, s.effort, s.frustration,
            s.tlx_score, s.submitted_at.isoformat() if s.submitted_at else "",
        ])
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=nasa_tlx.csv"},
    )
