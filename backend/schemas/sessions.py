from pydantic import BaseModel
from typing import Optional


class ContextProfileIn(BaseModel):
    network: str = "HOME"           # PUBLIC_WIFI | HOME | CORPORATE | VPN
    device: str = "KNOWN_DEVICE"    # NEW_DEVICE | KNOWN_DEVICE
    time_slot: str = "BUSINESS_HOURS"  # OFF_HOURS | BUSINESS_HOURS
    behavioral_anomaly_score: float = 0.0  # 0.0–1.0


class ParticipantCreate(BaseModel):
    demographics: Optional[dict] = None
    context_profile: Optional[ContextProfileIn] = None  # if None → random


class ParticipantOut(BaseModel):
    participant_id: str
    session_token: str
    session_id: str
    context_profile: dict

    model_config = {"from_attributes": True}


class SessionOut(BaseModel):
    session_id: str
    participant_id: str
    context_profile: dict
    started_at: str
    completed_at: Optional[str]

    model_config = {"from_attributes": True}
