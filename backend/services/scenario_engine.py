"""
Scenario Engine — defines the fixed sequence of scenarios for each session
and builds the initial ScenarioRun records.
"""

import random
from services.context_engine import evaluate_context

# Fixed ordered scenario sequence (all 5 shown to every participant)
SCENARIO_SEQUENCE = [
    "PHISHING",
    "NEW_DEVICE",
    "FILE_SHARE",
    "WIFI_ACCESS",
    "UNUSUAL_DOWNLOAD",
]


def build_scenario_runs(session_id: str, context_profile: dict) -> list[dict]:
    """
    Return a list of scenario run dicts (not yet persisted) with pre-calculated
    risk scores and warning levels based on the session's context profile.
    """
    runs = []
    for order, scenario_type in enumerate(SCENARIO_SEQUENCE):
        evaluation = evaluate_context(context_profile, scenario_type)
        runs.append({
            "session_id": session_id,
            "scenario_type": scenario_type,
            "scenario_order": str(order),
            "risk_score": evaluation["risk_score"],
            "warning_level": evaluation["warning_level"],
            "extra_data": {"context_factors": evaluation["context_factors"]},
        })
    return runs


def generate_random_context_profile() -> dict:
    """Generate a randomised context profile for between-subjects assignment."""
    return {
        "network": random.choice(["PUBLIC_WIFI", "HOME", "CORPORATE", "VPN"]),
        "device": random.choice(["NEW_DEVICE", "KNOWN_DEVICE"]),
        "time_slot": random.choice(["OFF_HOURS", "BUSINESS_HOURS"]),
        "behavioral_anomaly_score": round(random.uniform(0.0, 1.0), 2),
    }
