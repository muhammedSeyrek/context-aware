import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON
from database import Base


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_token = Column(String, unique=True, nullable=False, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    demographics = Column(JSON, nullable=True)  # age_group, tech_experience, etc.


class ScenarioSession(Base):
    __tablename__ = "scenario_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    participant_id = Column(String, nullable=False)
    context_profile = Column(JSON, nullable=False)
    # {
    #   "network": "PUBLIC_WIFI" | "HOME" | "CORPORATE" | "VPN",
    #   "device": "NEW_DEVICE" | "KNOWN_DEVICE",
    #   "time_slot": "OFF_HOURS" | "BUSINESS_HOURS",
    #   "behavioral_anomaly_score": 0.0-1.0
    # }
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
