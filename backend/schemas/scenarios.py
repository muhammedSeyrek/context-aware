from pydantic import BaseModel
from typing import Optional


class ScenarioRunOut(BaseModel):
    id: str
    session_id: str
    scenario_type: str
    scenario_order: str
    risk_score: float
    warning_level: str
    outcome: Optional[str]
    extra_data: Optional[dict]

    model_config = {"from_attributes": True}


class ScenarioCompleteIn(BaseModel):
    outcome: str   # COMPLETED_SAFE | UNSAFE_ACTION | ABANDONED | BYPASSED


class EventRecordIn(BaseModel):
    scenario_run_id: str
    session_id: str
    event_type: str
    duration_ms: Optional[int] = None
    metadata: Optional[dict] = None  # mapped to extra_data in the DB layer
