from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.scenario import ScenarioRun
from schemas.scenarios import ScenarioRunOut, ScenarioCompleteIn, EventRecordIn
from models.event import Event

router = APIRouter(prefix="/scenarios", tags=["scenarios"])


@router.get("/session/{session_id}", response_model=list[ScenarioRunOut])
def list_session_scenarios(session_id: str, db: Session = Depends(get_db)):
    """Return all scenario runs for a session ordered by scenario_order."""
    runs = (
        db.query(ScenarioRun)
        .filter(ScenarioRun.session_id == session_id)
        .order_by(ScenarioRun.scenario_order)
        .all()
    )
    return runs


@router.get("/session/{session_id}/next", response_model=ScenarioRunOut)
def get_next_scenario(session_id: str, db: Session = Depends(get_db)):
    """Return the next incomplete scenario run for the session."""
    run = (
        db.query(ScenarioRun)
        .filter(
            ScenarioRun.session_id == session_id,
            ScenarioRun.outcome.is_(None),
        )
        .order_by(ScenarioRun.scenario_order)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="No more scenarios")
    return run


@router.post("/{run_id}/complete", response_model=ScenarioRunOut)
def complete_scenario(run_id: str, body: ScenarioCompleteIn, db: Session = Depends(get_db)):
    run = db.query(ScenarioRun).filter(ScenarioRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Scenario run not found")
    run.outcome = body.outcome
    run.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    return run


@router.post("/events", status_code=201)
def record_event(body: EventRecordIn, db: Session = Depends(get_db)):
    event = Event(
        scenario_run_id=body.scenario_run_id,
        session_id=body.session_id,
        event_type=body.event_type,
        duration_ms=body.duration_ms,
        extra_data=body.metadata,
    )
    db.add(event)
    db.commit()
    return {"status": "recorded", "event_type": body.event_type}
