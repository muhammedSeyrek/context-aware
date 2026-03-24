from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.survey import PostScenarioSurvey, NasaTLXSurvey
from schemas.surveys import PostScenarioSurveyIn, NasaTLXIn

router = APIRouter(prefix="/surveys", tags=["surveys"])


@router.post("/post-scenario", status_code=201)
def submit_post_scenario(body: PostScenarioSurveyIn, db: Session = Depends(get_db)):
    existing = db.query(PostScenarioSurvey).filter(
        PostScenarioSurvey.scenario_run_id == body.scenario_run_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Survey already submitted for this scenario run")

    survey = PostScenarioSurvey(
        scenario_run_id=body.scenario_run_id,
        session_id=body.session_id,
        perceived_friction=body.perceived_friction,
        trust_score=body.trust_score,
        warning_helpful=body.warning_helpful,
    )
    db.add(survey)
    db.commit()
    return {"status": "submitted"}


@router.post("/nasa-tlx", status_code=201)
def submit_nasa_tlx(body: NasaTLXIn, db: Session = Depends(get_db)):
    existing = db.query(NasaTLXSurvey).filter(
        NasaTLXSurvey.session_id == body.session_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="NASA-TLX already submitted for this session")

    # Raw TLX score = unweighted mean of 6 subscales
    tlx_score = (
        body.mental_demand
        + body.physical_demand
        + body.temporal_demand
        + (100 - body.performance)  # performance: high value = good, so invert for load
        + body.effort
        + body.frustration
    ) / 6.0

    survey = NasaTLXSurvey(
        session_id=body.session_id,
        mental_demand=body.mental_demand,
        physical_demand=body.physical_demand,
        temporal_demand=body.temporal_demand,
        performance=body.performance,
        effort=body.effort,
        frustration=body.frustration,
        tlx_score=round(tlx_score, 2),
    )
    db.add(survey)
    db.commit()
    return {"status": "submitted", "tlx_score": tlx_score}
