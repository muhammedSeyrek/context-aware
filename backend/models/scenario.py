import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, JSON, Enum
from database import Base
import enum


class ScenarioType(str, enum.Enum):
    PHISHING = "PHISHING"
    NEW_DEVICE = "NEW_DEVICE"
    FILE_SHARE = "FILE_SHARE"
    WIFI_ACCESS = "WIFI_ACCESS"
    UNUSUAL_DOWNLOAD = "UNUSUAL_DOWNLOAD"


class WarningLevel(str, enum.Enum):
    NONE = "NONE"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class ScenarioOutcome(str, enum.Enum):
    COMPLETED_SAFE = "COMPLETED_SAFE"
    UNSAFE_ACTION = "UNSAFE_ACTION"
    ABANDONED = "ABANDONED"
    BYPASSED = "BYPASSED"


class ScenarioRun(Base):
    __tablename__ = "scenario_runs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String, nullable=False)
    scenario_type = Column(String, nullable=False)  # ScenarioType value
    scenario_order = Column(String, nullable=False, default="0")
    risk_score = Column(Float, nullable=False, default=0.0)
    warning_level = Column(String, nullable=False, default=WarningLevel.NONE)
    outcome = Column(String, nullable=True)  # ScenarioOutcome value
    extra_data = Column(JSON, nullable=True)  # extra scenario-specific data
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
