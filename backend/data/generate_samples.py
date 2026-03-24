"""
Sentetik örnek dataset üretici.

Yayınlanmış akademik çalışmalara dayalı gerçekçi değerler:
- BYU Neurosecurity Lab: habituation, uyarı uyum oranı 80%→30%
- Security Journal 2020: uyarı uyum 38%→61%
- MDPI Sensors 2021: bypass %42, okuma süresi 15s→2s (3 maruziyetten sonra)

3 koşul:
  high_risk : PUBLIC_WIFI + NEW_DEVICE + OFF_HOURS  → HIGH uyarı, bypass ~%45
  low_risk  : CORPORATE + KNOWN_DEVICE + BUSINESS_HOURS → NONE uyarı, unsafe ~%70
  mixed     : Karma profil → karışık uyarı seviyeleri, bypass ~%30
"""

import csv, random, uuid
from datetime import datetime, timedelta
from pathlib import Path

random.seed(42)  # tekrar üretilebilirlik

BASE = Path(__file__).parent / "samples"
SCENARIO_TYPES = ["PHISHING", "NEW_DEVICE", "FILE_SHARE", "WIFI_ACCESS", "UNUSUAL_DOWNLOAD"]


def uid():
    return str(uuid.uuid4())


def ts(base, offset_s=0):
    return (base + timedelta(seconds=offset_s)).isoformat()


# ─── Yardımcı: ağırlıklı seçim ───────────────────────────────────────────────

def wchoice(options, weights):
    r = random.random()
    cumulative = 0
    for opt, w in zip(options, weights):
        cumulative += w
        if r < cumulative:
            return opt
    return options[-1]


# ─── Dataset üretici ─────────────────────────────────────────────────────────

def generate_dataset(name, n_sessions, config):
    """
    config keys:
      warning_level   : sabit uyarı seviyesi (HIGH/NONE) veya 'mixed'
      risk_score_range: (min, max) tuple
      outcome_weights : {HIGH: [...], LOW: [...], MEDIUM: [...], NONE: [...]}
        her seviye için [COMPLETED_SAFE, UNSAFE_ACTION, BYPASSED, ABANDONED] ağırlıkları
      reading_time_ms : (mean, std) – WARNING_READ süresi
      dismiss_time_ms : (mean, std) – WARNING_DISMISSED süresi
      friction_range  : (min, max) Likert 1-7
      trust_range     : (min, max) Likert 1-7
      tlx_range       : (mean, std) NASA-TLX 0-100 per subscale
    """
    out = BASE / name
    runs_rows, events_rows, survey_rows, tlx_rows = [], [], [], []

    now_base = datetime(2025, 3, 1, 9, 0, 0)

    for s_idx in range(n_sessions):
        session_id = uid()
        session_start = now_base + timedelta(days=s_idx // 2, hours=s_idx % 12)

        for sc_idx, stype in enumerate(SCENARIO_TYPES):
            run_id = uid()
            run_start = session_start + timedelta(minutes=sc_idx * 4)

            # Uyarı seviyesi
            if config["warning_level"] == "mixed":
                wl = wchoice(
                    ["NONE", "LOW", "MEDIUM", "HIGH"],
                    [0.20, 0.20, 0.30, 0.30]
                )
            else:
                wl = config["warning_level"]

            # Risk skoru
            rmin, rmax = config["risk_score_range"].get(wl, (0.0, 0.2))
            risk_score = round(random.uniform(rmin, rmax), 3)

            # Sonuç (outcome)
            weights = config["outcome_weights"][wl]
            outcome = wchoice(
                ["COMPLETED_SAFE", "UNSAFE_ACTION", "BYPASSED", "ABANDONED"],
                weights
            )

            # Tamamlanma süresi (saniye)
            duration_s = random.gauss(55, 18)
            duration_s = max(10, duration_s)
            run_end = run_start + timedelta(seconds=duration_s)

            runs_rows.append({
                "id": run_id,
                "session_id": session_id,
                "scenario_type": stype,
                "scenario_order": str(sc_idx),
                "risk_score": risk_score,
                "warning_level": wl,
                "outcome": outcome,
                "started_at": run_start.isoformat(),
                "completed_at": run_end.isoformat(),
            })

            # Olaylar (events)
            events_rows.append({
                "id": uid(), "scenario_run_id": run_id, "session_id": session_id,
                "event_type": "SCENARIO_STARTED", "duration_ms": "", "timestamp": ts(run_start),
            })

            if wl != "NONE":
                warn_at = run_start + timedelta(seconds=random.uniform(2, 6))
                # WARNING_SHOWN
                events_rows.append({
                    "id": uid(), "scenario_run_id": run_id, "session_id": session_id,
                    "event_type": "WARNING_SHOWN", "duration_ms": "",
                    "timestamp": ts(warn_at),
                })
                # WARNING_READ — habituation etkisi: senaryo ilerledikçe daha kısa okuma
                mean_read, std_read = config["reading_time_ms"]
                habituation_factor = max(0.3, 1.0 - sc_idx * 0.15)  # 15% azalma her seferinde
                read_ms = int(max(500, random.gauss(mean_read * habituation_factor, std_read)))
                events_rows.append({
                    "id": uid(), "scenario_run_id": run_id, "session_id": session_id,
                    "event_type": "WARNING_READ", "duration_ms": read_ms,
                    "timestamp": ts(warn_at, 1),
                })
                # WARNING_DISMISSED veya ACTION
                mean_dis, std_dis = config["dismiss_time_ms"]
                dis_ms = int(max(200, random.gauss(mean_dis, std_dis)))
                events_rows.append({
                    "id": uid(), "scenario_run_id": run_id, "session_id": session_id,
                    "event_type": "WARNING_DISMISSED" if outcome in ("COMPLETED_SAFE", "BYPASSED") else "ACTION_SAFE",
                    "duration_ms": dis_ms,
                    "timestamp": ts(warn_at, 2),
                })
                # Geri dönüş olayı (~%15 ihtimalle)
                if outcome == "COMPLETED_SAFE" and random.random() < 0.15:
                    events_rows.append({
                        "id": uid(), "scenario_run_id": run_id, "session_id": session_id,
                        "event_type": "RETURN_TO_WARNING", "duration_ms": "",
                        "timestamp": ts(warn_at, 8),
                    })

            events_rows.append({
                "id": uid(), "scenario_run_id": run_id, "session_id": session_id,
                "event_type": "SCENARIO_COMPLETED", "duration_ms": "",
                "timestamp": ts(run_end),
            })

            # Senaryo sonrası anket
            fmin, fmax = config["friction_range"]
            tmin, tmax = config["trust_range"]
            # Yüksek uyarı → daha fazla sürtüşme
            friction_boost = {"HIGH": 1, "MEDIUM": 0, "LOW": -1, "NONE": -2}.get(wl, 0)
            friction = max(1, min(7, round(random.gauss((fmin + fmax) / 2 + friction_boost, 1))))
            trust = max(1, min(7, round(random.gauss((tmin + tmax) / 2, 1))))
            helpful = (wl != "NONE" and random.random() > 0.35)

            survey_rows.append({
                "id": uid(),
                "scenario_run_id": run_id,
                "session_id": session_id,
                "perceived_friction": friction,
                "trust_score": trust,
                "warning_helpful": str(helpful) if wl != "NONE" else "",
                "submitted_at": ts(run_end, 30),
            })

        # NASA-TLX (oturum sonu, bir kez)
        tlx_mean, tlx_std = config["tlx_range"]

        def tlx_val(offset=0):
            return max(0, min(100, round(random.gauss(tlx_mean + offset, tlx_std))))

        md, pd_, td, perf, ef, fr = (
            tlx_val(5), tlx_val(-20), tlx_val(0),
            tlx_val(10), tlx_val(0), tlx_val(-5),
        )
        score = round((md + pd_ + td + (100 - perf) + ef + fr) / 6, 2)
        tlx_rows.append({
            "id": uid(), "session_id": session_id,
            "mental_demand": md, "physical_demand": pd_, "temporal_demand": td,
            "performance": perf, "effort": ef, "frustration": fr,
            "tlx_score": score,
            "submitted_at": ts(session_start, 1800),
        })

    # CSV yazımı
    _write_csv(out / "scenario_runs.csv",
               ["id","session_id","scenario_type","scenario_order","risk_score",
                "warning_level","outcome","started_at","completed_at"],
               runs_rows)
    _write_csv(out / "events.csv",
               ["id","scenario_run_id","session_id","event_type","duration_ms","timestamp"],
               events_rows)
    _write_csv(out / "surveys.csv",
               ["id","scenario_run_id","session_id","perceived_friction","trust_score",
                "warning_helpful","submitted_at"],
               survey_rows)
    _write_csv(out / "nasa_tlx.csv",
               ["id","session_id","mental_demand","physical_demand","temporal_demand",
                "performance","effort","frustration","tlx_score","submitted_at"],
               tlx_rows)
    print(f"✓ {name}: {len(runs_rows)} runs, {len(events_rows)} events, "
          f"{len(survey_rows)} surveys, {len(tlx_rows)} TLX records")


def _write_csv(path, fieldnames, rows):
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


# ─── Koşul tanımları ─────────────────────────────────────────────────────────

HIGH_RISK = {
    "warning_level": "HIGH",
    "risk_score_range": {"HIGH": (0.70, 1.0)},
    "outcome_weights": {
        # [COMPLETED_SAFE, UNSAFE_ACTION, BYPASSED, ABANDONED]
        "HIGH":   [0.45, 0.00, 0.45, 0.10],
    },
    "reading_time_ms": (12000, 3000),  # ~12s ortalama (literatür: 15s ilk maruz)
    "dismiss_time_ms": (3000, 800),
    "friction_range":  (4, 6),
    "trust_range":     (2, 4),
    "tlx_range":       (65, 12),
}

LOW_RISK = {
    "warning_level": "NONE",
    "risk_score_range": {"NONE": (0.0, 0.19)},
    "outcome_weights": {
        # Uyarı yok → çoğunlukla güvensiz eylem
        "NONE":   [0.25, 0.70, 0.00, 0.05],
    },
    "reading_time_ms": (4000, 1200),
    "dismiss_time_ms": (1500, 500),
    "friction_range":  (1, 3),
    "trust_range":     (5, 7),
    "tlx_range":       (28, 8),
}

MIXED = {
    "warning_level": "mixed",
    "risk_score_range": {
        "NONE":   (0.0, 0.19),
        "LOW":    (0.20, 0.39),
        "MEDIUM": (0.40, 0.69),
        "HIGH":   (0.70, 1.0),
    },
    "outcome_weights": {
        "NONE":   [0.28, 0.67, 0.00, 0.05],
        "LOW":    [0.55, 0.05, 0.30, 0.10],
        "MEDIUM": [0.50, 0.02, 0.38, 0.10],
        "HIGH":   [0.45, 0.00, 0.45, 0.10],
    },
    "reading_time_ms": (8000, 2500),
    "dismiss_time_ms": (2200, 700),
    "friction_range":  (3, 5),
    "trust_range":     (3, 5),
    "tlx_range":       (48, 11),
}

if __name__ == "__main__":
    generate_dataset("high_risk", n_sessions=10, config=HIGH_RISK)
    generate_dataset("low_risk",  n_sessions=10, config=LOW_RISK)
    generate_dataset("mixed",     n_sessions=20, config=MIXED)
    print("\nTüm örnek datasetler oluşturuldu.")
