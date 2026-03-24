"""
In-memory dataset analysis service.

CSV yüklenen veya örnek datasetin dict listelerine dönüştürülmüş verisi üzerinde
metrics_service.py ile birebir aynı metrikleri hesaplar.
DB bağlantısı kullanılmaz — saf Python hesaplaması.
"""

from datetime import datetime
from statistics import mean as _mean


# ─── Yardımcılar ──────────────────────────────────────────────────────────────

def _safe_mean(values: list) -> float:
    vals = [v for v in values if v is not None]
    return round(_mean(vals), 3) if vals else 0.0


def _parse_dt(s):
    if not s:
        return None
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return None


# ─── Güvenlik metrikleri ──────────────────────────────────────────────────────

def _unsafe_action_rate(runs: list[dict]) -> float:
    if not runs:
        return 0.0
    n = sum(1 for r in runs if r.get("outcome") == "UNSAFE_ACTION")
    return round(n / len(runs), 4)


def _detection_rate(runs: list[dict]) -> float:
    high_risk = [r for r in runs if _to_float(r.get("risk_score")) >= 0.7]
    if not high_risk:
        return 0.0
    warned = sum(1 for r in high_risk if r.get("warning_level") == "HIGH")
    return round(warned / len(high_risk), 4)


def _false_positive_rate(runs: list[dict]) -> float:
    low_risk = [r for r in runs if _to_float(r.get("risk_score")) < 0.2]
    if not low_risk:
        return 0.0
    warned = sum(1 for r in low_risk if r.get("warning_level", "NONE") != "NONE")
    return round(warned / len(low_risk), 4)


# ─── İnsan-merkezli metrikler ─────────────────────────────────────────────────

def _avg_perceived_friction(surveys: list[dict]) -> float:
    return _safe_mean([_to_float(s.get("perceived_friction")) for s in surveys])


def _avg_trust_score(surveys: list[dict]) -> float:
    return _safe_mean([_to_float(s.get("trust_score")) for s in surveys])


def _avg_task_completion_time_ms(runs: list[dict]) -> float:
    durations = []
    for r in runs:
        start = _parse_dt(r.get("started_at"))
        end = _parse_dt(r.get("completed_at"))
        if start and end:
            durations.append((end - start).total_seconds() * 1000)
    return round(_mean(durations), 1) if durations else 0.0


def _warning_adherence_rate(runs: list[dict]) -> float:
    warned = [r for r in runs if r.get("warning_level", "NONE") != "NONE"]
    if not warned:
        return 0.0
    safe = sum(1 for r in warned if r.get("outcome") == "COMPLETED_SAFE")
    return round(safe / len(warned), 4)


def _bypass_rate(runs: list[dict]) -> float:
    warned = [r for r in runs if r.get("warning_level", "NONE") != "NONE"]
    if not warned:
        return 0.0
    bypassed = sum(1 for r in warned if r.get("outcome") == "BYPASSED")
    return round(bypassed / len(warned), 4)


def _abandonment_rate(runs: list[dict]) -> float:
    if not runs:
        return 0.0
    return round(sum(1 for r in runs if r.get("outcome") == "ABANDONED") / len(runs), 4)


def _nasa_tlx_metrics(tlx: list[dict]) -> dict:
    if not tlx:
        return {}
    fields = ["mental_demand", "physical_demand", "temporal_demand",
              "performance", "effort", "frustration"]
    result = {}
    for f in fields:
        result[f] = _safe_mean([_to_float(s.get(f)) for s in tlx])
    scores = [_to_float(s.get("tlx_score")) for s in tlx if s.get("tlx_score") is not None]
    result["tlx_score"] = round(_mean(scores), 2) if scores else 0.0
    return result


# ─── Davranışsal metrikler ────────────────────────────────────────────────────

def _avg_event_duration(events: list[dict], event_type: str) -> float:
    vals = [_to_float(e.get("duration_ms"))
            for e in events
            if e.get("event_type") == event_type and e.get("duration_ms") not in (None, "")]
    return round(_mean(vals), 1) if vals else 0.0


def _return_rate(events: list[dict]) -> float:
    dismissed = sum(1 for e in events if e.get("event_type") == "WARNING_DISMISSED")
    if dismissed == 0:
        return 0.0
    returned = sum(1 for e in events if e.get("event_type") == "RETURN_TO_WARNING")
    return round(returned / dismissed, 4)


def _behavior_change_rate(runs: list[dict], events: list[dict]) -> float:
    retry_run_ids = {e["scenario_run_id"]
                     for e in events if e.get("event_type") == "RETURN_TO_WARNING"}
    if not retry_run_ids:
        return 0.0
    safe_retries = sum(1 for r in runs
                       if r.get("id") in retry_run_ids and r.get("outcome") == "COMPLETED_SAFE")
    return round(safe_retries / len(retry_run_ids), 4)


# ─── Senaryo bazlı kırılım ────────────────────────────────────────────────────

def _metrics_by_scenario(runs: list[dict]) -> dict:
    types = ["PHISHING", "NEW_DEVICE", "FILE_SHARE", "WIFI_ACCESS", "UNUSUAL_DOWNLOAD"]
    result = {}
    for stype in types:
        subset = [r for r in runs if r.get("scenario_type") == stype]
        total = len(subset)
        if total == 0:
            result[stype] = {"total": 0}
            continue
        risks = [_to_float(r.get("risk_score", 0)) for r in subset]
        result[stype] = {
            "total": total,
            "unsafe_action_rate": round(
                sum(1 for r in subset if r.get("outcome") == "UNSAFE_ACTION") / total, 4),
            "safe_rate": round(
                sum(1 for r in subset if r.get("outcome") == "COMPLETED_SAFE") / total, 4),
            "bypass_rate": round(
                sum(1 for r in subset if r.get("outcome") == "BYPASSED") / total, 4),
            "abandonment_rate": round(
                sum(1 for r in subset if r.get("outcome") == "ABANDONED") / total, 4),
            "avg_risk_score": round(_mean(risks), 3),
        }
    return result


# ─── Ana fonksiyon ────────────────────────────────────────────────────────────

def calculate_metrics_from_dicts(
    scenario_runs: list[dict],
    events: list[dict] | None = None,
    surveys: list[dict] | None = None,
    nasa_tlx: list[dict] | None = None,
) -> dict:
    """
    Verilen dict listelerinden tüm metrikleri hesaplar.
    Eksik veriler için ilgili metrik 0 ya da boş döner.
    """
    events = events or []
    surveys = surveys or []
    nasa_tlx = nasa_tlx or []

    available = ["security"]
    if surveys:
        available.append("human_centered")
    if events:
        available.append("behavioral")
    if nasa_tlx:
        available.append("nasa_tlx")

    return {
        "security": {
            "unsafe_action_rate": _unsafe_action_rate(scenario_runs),
            "detection_rate": _detection_rate(scenario_runs),
            "false_positive_rate": _false_positive_rate(scenario_runs),
        },
        "human_centered": {
            "avg_perceived_friction": _avg_perceived_friction(surveys) if surveys else None,
            "avg_trust_score": _avg_trust_score(surveys) if surveys else None,
            "avg_task_completion_time_ms": _avg_task_completion_time_ms(scenario_runs),
            "warning_adherence_rate": _warning_adherence_rate(scenario_runs),
            "bypass_rate": _bypass_rate(scenario_runs),
            "abandonment_rate": _abandonment_rate(scenario_runs),
            "nasa_tlx": _nasa_tlx_metrics(nasa_tlx) if nasa_tlx else None,
        },
        "behavioral": {
            "avg_warning_reading_time_ms": _avg_event_duration(events, "WARNING_READ") if events else None,
            "avg_dismiss_time_ms": _avg_event_duration(events, "WARNING_DISMISSED") if events else None,
            "return_rate": _return_rate(events) if events else None,
            "behavior_change_rate": _behavior_change_rate(scenario_runs, events) if events else None,
        },
        "by_scenario": _metrics_by_scenario(scenario_runs),
        "meta": {
            "total_runs": len(scenario_runs),
            "total_events": len(events),
            "total_surveys": len(surveys),
            "total_tlx": len(nasa_tlx),
            "available_metric_groups": available,
        },
    }


# ─── Yardımcı dönüşüm ────────────────────────────────────────────────────────

def _to_float(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
