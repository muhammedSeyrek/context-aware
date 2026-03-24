import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, Float, DateTime
from database import Base


class PostScenarioSurvey(Base):
    """Short survey after each scenario run."""
    __tablename__ = "post_scenario_surveys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_run_id = Column(String, nullable=False, unique=True)
    session_id = Column(String, nullable=False)

    # 1–7 Likert scales
    perceived_friction = Column(Integer, nullable=False)  # "Bu işlemi tamamlamak ne kadar zordu?"
    trust_score = Column(Integer, nullable=False)          # "Sisteme ne kadar güveniyorsunuz?"
    warning_helpful = Column(Boolean, nullable=True)       # "Uyarı faydalı mıydı?"

    submitted_at = Column(DateTime, default=datetime.utcnow)


class NasaTLXSurvey(Base):
    """NASA Task Load Index — collected once at end of session."""
    __tablename__ = "nasa_tlx_surveys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False, unique=True)

    # 0–100 scales
    mental_demand = Column(Integer, nullable=False)
    physical_demand = Column(Integer, nullable=False)
    temporal_demand = Column(Integer, nullable=False)
    performance = Column(Integer, nullable=False)   # subjective success (higher = better)
    effort = Column(Integer, nullable=False)
    frustration = Column(Integer, nullable=False)

    # Computed weighted score (stored for quick retrieval)
    tlx_score = Column(Float, nullable=True)

    submitted_at = Column(DateTime, default=datetime.utcnow)
