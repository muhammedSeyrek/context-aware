from pydantic import BaseModel, Field
from typing import Optional


class PostScenarioSurveyIn(BaseModel):
    scenario_run_id: str
    session_id: str
    perceived_friction: int = Field(ge=1, le=7)
    trust_score: int = Field(ge=1, le=7)
    warning_helpful: Optional[bool] = None


class NasaTLXIn(BaseModel):
    session_id: str
    mental_demand: int = Field(ge=0, le=100)
    physical_demand: int = Field(ge=0, le=100)
    temporal_demand: int = Field(ge=0, le=100)
    performance: int = Field(ge=0, le=100)
    effort: int = Field(ge=0, le=100)
    frustration: int = Field(ge=0, le=100)
