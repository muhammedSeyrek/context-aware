import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.participant import Participant, ScenarioSession
from models.scenario import ScenarioRun
from schemas.sessions import ParticipantCreate, ParticipantOut, SessionOut
from services.scenario_engine import build_scenario_runs, generate_random_context_profile

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/create", response_model=ParticipantOut)
def create_session(body: ParticipantCreate, db: Session = Depends(get_db)):
    # Create participant
    participant = Participant(
        id=str(uuid.uuid4()),
        session_token=str(uuid.uuid4()),
        demographics=body.demographics,
    )
    db.add(participant)

    # Resolve context profile
    if body.context_profile:
        context = body.context_profile.model_dump()
    else:
        context = generate_random_context_profile()

    # Create session
    session = ScenarioSession(
        id=str(uuid.uuid4()),
        participant_id=participant.id,
        context_profile=context,
    )
    db.add(session)

    # Pre-create all scenario runs
    runs = build_scenario_runs(session.id, context)
    for run_data in runs:
        run_data_copy = {k: v for k, v in run_data.items()}
        db.add(ScenarioRun(**run_data_copy))

    db.commit()
    db.refresh(participant)
    db.refresh(session)

    return ParticipantOut(
        participant_id=participant.id,
        session_token=participant.session_token,
        session_id=session.id,
        context_profile=context,
    )


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ScenarioSession).filter(ScenarioSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionOut(
        session_id=session.id,
        participant_id=session.participant_id,
        context_profile=session.context_profile,
        started_at=session.started_at.isoformat(),
        completed_at=session.completed_at.isoformat() if session.completed_at else None,
    )


@router.post("/{session_id}/complete")
def complete_session(session_id: str, db: Session = Depends(get_db)):
    from datetime import datetime
    session = db.query(ScenarioSession).filter(ScenarioSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    session.completed_at = datetime.utcnow()
    db.commit()
    return {"status": "completed"}
