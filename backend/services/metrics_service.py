"""
Metrics Service — aggregates raw DB records into the three metric categories:
  1. Security metrics
  2. Human-centered metrics
  3. Behavioral metrics
"""

from sqlalchemy.orm import Session
from sqlalchemy import func
from models import ScenarioRun, Event, PostScenarioSurvey, NasaTLXSurvey


# ---------------------------------------------------------------------------
# Security metrics
# ---------------------------------------------------------------------------

def unsafe_action_rate(db: Session, session_id: str | None = None) -> float:
    q = db.query(ScenarioRun)
    if session_id:
        q = q.filter(ScenarioRun.session_id == session_id)
    total = q.count()
    if total == 0:
        return 0.0
    unsafe = q.filter(ScenarioRun.outcome == "UNSAFE_ACTION").count()
    return round(unsafe / total, 4)


def detection_rate(db: Session) -> float:
    """Fraction of HIGH-risk scenarios where a HIGH warning was shown."""
    high_risk = db.query(ScenarioRun).filter(ScenarioRun.risk_score >= 0.7).count()
    if high_risk == 0:
        return 0.0
    warned = (
        db.query(ScenarioRun)
        .filter(ScenarioRun.risk_score >= 0.7, ScenarioRun.warning_level == "HIGH")
        .count()
    )
    return round(warned / high_risk, 4)


def false_positive_rate(db: Session) -> float:
    """Fraction of LOW-risk scenarios that triggered a warning (any level)."""
    low_risk = db.query(ScenarioRun).filter(ScenarioRun.risk_score < 0.2).count()
    if low_risk == 0:
        return 0.0
    warned = (
        db.query(ScenarioRun)
        .filter(ScenarioRun.risk_score < 0.2, ScenarioRun.warning_level != "NONE")
        .count()
    )
    return round(warned / low_risk, 4)


# ---------------------------------------------------------------------------
# Human-centered metrics
# ---------------------------------------------------------------------------

def avg_perceived_friction(db: Session) -> float:
    result = db.query(func.avg(PostScenarioSurvey.perceived_friction)).scalar()
    return round(result or 0.0, 3)


def avg_trust_score(db: Session) -> float:
    result = db.query(func.avg(PostScenarioSurvey.trust_score)).scalar()
    return round(result or 0.0, 3)


def avg_task_completion_time_ms(db: Session) -> float:
    """Average time (ms) to complete a scenario run."""
    runs = db.query(ScenarioRun).filter(ScenarioRun.completed_at.isnot(None)).all()
    if not runs:
        return 0.0
    durations = [
        (r.completed_at - r.started_at).total_seconds() * 1000
        for r in runs
        if r.completed_at and r.started_at
    ]
    return round(sum(durations) / len(durations), 1) if durations else 0.0


def warning_adherence_rate(db: Session) -> float:
    """Fraction of warned scenarios where user chose the SAFE path."""
    warned = (
        db.query(ScenarioRun)
        .filter(ScenarioRun.warning_level != "NONE")
        .count()
    )
    if warned == 0:
        return 0.0
    safe_after_warning = (
        db.query(ScenarioRun)
        .filter(
            ScenarioRun.warning_level != "NONE",
            ScenarioRun.outcome == "COMPLETED_SAFE",
        )
        .count()
    )
    return round(safe_after_warning / warned, 4)


def bypass_rate(db: Session) -> float:
    warned = db.query(ScenarioRun).filter(ScenarioRun.warning_level != "NONE").count()
    if warned == 0:
        return 0.0
    bypassed = (
        db.query(ScenarioRun)
        .filter(ScenarioRun.warning_level != "NONE", ScenarioRun.outcome == "BYPASSED")
        .count()
    )
    return round(bypassed / warned, 4)


def abandonment_rate(db: Session) -> float:
    total = db.query(ScenarioRun).count()
    if total == 0:
        return 0.0
    abandoned = db.query(ScenarioRun).filter(ScenarioRun.outcome == "ABANDONED").count()
    return round(abandoned / total, 4)


def avg_nasa_tlx(db: Session) -> dict:
    surveys = db.query(NasaTLXSurvey).all()
    if not surveys:
        return {}
    fields = ["mental_demand", "physical_demand", "temporal_demand", "performance", "effort", "frustration"]
    result = {}
    for f in fields:
        values = [getattr(s, f) for s in surveys if getattr(s, f) is not None]
        result[f] = round(sum(values) / len(values), 2) if values else 0.0
    tlx_scores = [s.tlx_score for s in surveys if s.tlx_score is not None]
    result["tlx_score"] = round(sum(tlx_scores) / len(tlx_scores), 2) if tlx_scores else 0.0
    return result


# ---------------------------------------------------------------------------
# Behavioral metrics
# ---------------------------------------------------------------------------

def avg_warning_reading_time_ms(db: Session) -> float:
    result = db.query(func.avg(Event.duration_ms)).filter(Event.event_type == "WARNING_READ").scalar()
    return round(result or 0.0, 1)


def avg_dismiss_time_ms(db: Session) -> float:
    result = db.query(func.avg(Event.duration_ms)).filter(Event.event_type == "WARNING_DISMISSED").scalar()
    return round(result or 0.0, 1)


def return_rate(db: Session) -> float:
    """Fraction of WARNING_DISMISSED events followed by RETURN_TO_WARNING."""
    dismissed = db.query(Event).filter(Event.event_type == "WARNING_DISMISSED").count()
    if dismissed == 0:
        return 0.0
    returned = db.query(Event).filter(Event.event_type == "RETURN_TO_WARNING").count()
    return round(returned / dismissed, 4)


def behavior_change_rate(db: Session) -> float:
    """
    Among scenario runs that had a retry (RETURN_TO_WARNING), fraction where
    the final outcome was COMPLETED_SAFE (i.e., the user changed behaviour).
    Approximated by checking runs that have both RETURN_TO_WARNING event
    and a COMPLETED_SAFE outcome.
    """
    retry_run_ids = (
        db.query(Event.scenario_run_id)
        .filter(Event.event_type == "RETURN_TO_WARNING")
        .distinct()
        .all()
    )
    ids = [r[0] for r in retry_run_ids]
    if not ids:
        return 0.0
    safe_retries = (
        db.query(ScenarioRun)
        .filter(ScenarioRun.id.in_(ids), ScenarioRun.outcome == "COMPLETED_SAFE")
        .count()
    )
    return round(safe_retries / len(ids), 4)


# ---------------------------------------------------------------------------
# Aggregate all metrics for the dashboard
# ---------------------------------------------------------------------------

def get_all_metrics(db: Session) -> dict:
    return {
        "security": {
            "unsafe_action_rate": unsafe_action_rate(db),
            "detection_rate": detection_rate(db),
            "false_positive_rate": false_positive_rate(db),
        },
        "human_centered": {
            "avg_perceived_friction": avg_perceived_friction(db),
            "avg_trust_score": avg_trust_score(db),
            "avg_task_completion_time_ms": avg_task_completion_time_ms(db),
            "warning_adherence_rate": warning_adherence_rate(db),
            "bypass_rate": bypass_rate(db),
            "abandonment_rate": abandonment_rate(db),
            "nasa_tlx": avg_nasa_tlx(db),
        },
        "behavioral": {
            "avg_warning_reading_time_ms": avg_warning_reading_time_ms(db),
            "avg_dismiss_time_ms": avg_dismiss_time_ms(db),
            "return_rate": return_rate(db),
            "behavior_change_rate": behavior_change_rate(db),
        },
    }
