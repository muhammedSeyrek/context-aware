"""Tests for the context engine risk score calculations."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.context_engine import calculate_risk_score, get_warning_level, evaluate_context


def test_zero_risk_corporate_known_business():
    """Corporate network, known device, business hours = minimal risk."""
    ctx = {"network": "CORPORATE", "device": "KNOWN_DEVICE", "time_slot": "BUSINESS_HOURS", "behavioral_anomaly_score": 0.0}
    score = calculate_risk_score(ctx, "FILE_SHARE")
    assert score < 0.2, f"Expected low risk, got {score}"
    assert get_warning_level(score) == "NONE"


def test_high_risk_public_wifi_new_device_off_hours():
    """Public Wi-Fi + new device + off hours = high risk."""
    ctx = {"network": "PUBLIC_WIFI", "device": "NEW_DEVICE", "time_slot": "OFF_HOURS", "behavioral_anomaly_score": 0.8}
    score = calculate_risk_score(ctx, "PHISHING")
    assert score >= 0.7, f"Expected high risk, got {score}"
    assert get_warning_level(score) == "HIGH"


def test_medium_risk():
    """Public Wi-Fi + known device + business hours = medium risk."""
    ctx = {"network": "PUBLIC_WIFI", "device": "KNOWN_DEVICE", "time_slot": "BUSINESS_HOURS", "behavioral_anomaly_score": 0.0}
    score = calculate_risk_score(ctx, "FILE_SHARE")
    assert 0.2 <= score < 0.7, f"Expected medium/low risk, got {score}"


def test_risk_score_capped_at_1():
    """Risk score should never exceed 1.0."""
    ctx = {"network": "PUBLIC_WIFI", "device": "NEW_DEVICE", "time_slot": "OFF_HOURS", "behavioral_anomaly_score": 1.0}
    score = calculate_risk_score(ctx, "PHISHING")
    assert score <= 1.0


def test_evaluate_context_returns_factors():
    ctx = {"network": "PUBLIC_WIFI", "device": "NEW_DEVICE", "time_slot": "OFF_HOURS", "behavioral_anomaly_score": 0.5}
    result = evaluate_context(ctx, "PHISHING")
    assert "risk_score" in result
    assert "warning_level" in result
    assert "context_factors" in result
    assert result["context_factors"]["network_risk"] == 0.40


def test_warning_levels():
    assert get_warning_level(0.0) == "NONE"
    assert get_warning_level(0.19) == "NONE"
    assert get_warning_level(0.20) == "LOW"
    assert get_warning_level(0.39) == "LOW"
    assert get_warning_level(0.40) == "MEDIUM"
    assert get_warning_level(0.69) == "MEDIUM"
    assert get_warning_level(0.70) == "HIGH"
    assert get_warning_level(1.0) == "HIGH"
