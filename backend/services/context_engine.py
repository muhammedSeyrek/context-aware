"""
Context Engine — calculates a risk score from a context profile,
then determines the appropriate warning level for a given scenario.

Context profile fields:
  network: "PUBLIC_WIFI" | "HOME" | "CORPORATE" | "VPN"
  device:  "NEW_DEVICE"  | "KNOWN_DEVICE"
  time_slot: "OFF_HOURS" | "BUSINESS_HOURS"
  behavioral_anomaly_score: 0.0–1.0 (higher = more anomalous)

Risk score: 0.0–1.0
  >= 0.7  → HIGH
  >= 0.4  → MEDIUM
  >= 0.2  → LOW
  < 0.2   → NONE
"""

from typing import TypedDict

# ---------------------------------------------------------------------------
# Risk weights per context dimension
# ---------------------------------------------------------------------------

NETWORK_WEIGHTS = {
    "PUBLIC_WIFI": 0.40,
    "HOME":        0.10,
    "VPN":         0.05,
    "CORPORATE":   0.00,
}

DEVICE_WEIGHTS = {
    "NEW_DEVICE":   0.30,
    "KNOWN_DEVICE": 0.00,
}

TIME_WEIGHTS = {
    "OFF_HOURS":      0.20,
    "BUSINESS_HOURS": 0.00,
}

# Behavioral anomaly contributes up to 0.30 additional weight
BEHAVIORAL_MAX_WEIGHT = 0.30

# Scenario-specific multipliers — some scenarios are inherently riskier
SCENARIO_MULTIPLIERS = {
    "PHISHING":          1.20,
    "UNUSUAL_DOWNLOAD":  1.10,
    "FILE_SHARE":        1.00,
    "WIFI_ACCESS":       0.90,
    "NEW_DEVICE":        0.95,
}


class ContextProfile(TypedDict):
    network: str
    device: str
    time_slot: str
    behavioral_anomaly_score: float


def calculate_risk_score(context: ContextProfile, scenario_type: str = "") -> float:
    """Return a normalised risk score in [0.0, 1.0]."""
    score = 0.0
    score += NETWORK_WEIGHTS.get(context.get("network", "HOME"), 0.0)
    score += DEVICE_WEIGHTS.get(context.get("device", "KNOWN_DEVICE"), 0.0)
    score += TIME_WEIGHTS.get(context.get("time_slot", "BUSINESS_HOURS"), 0.0)
    score += context.get("behavioral_anomaly_score", 0.0) * BEHAVIORAL_MAX_WEIGHT

    multiplier = SCENARIO_MULTIPLIERS.get(scenario_type, 1.0)
    score *= multiplier

    return round(min(score, 1.0), 3)


def get_warning_level(risk_score: float) -> str:
    if risk_score >= 0.7:
        return "HIGH"
    if risk_score >= 0.4:
        return "MEDIUM"
    if risk_score >= 0.2:
        return "LOW"
    return "NONE"


def evaluate_context(context: ContextProfile, scenario_type: str) -> dict:
    """Return risk_score + warning_level for a scenario in a given context."""
    risk_score = calculate_risk_score(context, scenario_type)
    warning_level = get_warning_level(risk_score)
    return {
        "risk_score": risk_score,
        "warning_level": warning_level,
        "context_factors": {
            "network_risk": NETWORK_WEIGHTS.get(context.get("network", "HOME"), 0.0),
            "device_risk": DEVICE_WEIGHTS.get(context.get("device", "KNOWN_DEVICE"), 0.0),
            "time_risk": TIME_WEIGHTS.get(context.get("time_slot", "BUSINESS_HOURS"), 0.0),
            "behavioral_risk": context.get("behavioral_anomaly_score", 0.0) * BEHAVIORAL_MAX_WEIGHT,
        },
    }
