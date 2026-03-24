import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, JSON
from database import Base


# Event types recorded during scenario runs
EVENT_TYPES = [
    "SCENARIO_STARTED",
    "WARNING_SHOWN",
    "WARNING_READ",       # user focused/scrolled on warning
    "WARNING_DISMISSED",  # clicked dismiss/close
    "LINK_CLICKED",       # phishing link clicked
    "FORM_SUBMITTED",
    "ACTION_SAFE",        # user chose safe path
    "ACTION_UNSAFE",      # user chose risky path
    "ACTION_BYPASSED",    # user bypassed warning explicitly
    "ACTION_ABANDONED",   # user left / skipped
    "RETURN_TO_WARNING",  # user came back after dismiss
    "SCENARIO_COMPLETED",
]


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scenario_run_id = Column(String, nullable=False)
    session_id = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    duration_ms = Column(Integer, nullable=True)  # for read/dismiss timing
    timestamp = Column(DateTime, default=datetime.utcnow)
    extra_data = Column(JSON, nullable=True)  # extra event-specific data
