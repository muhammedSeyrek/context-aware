"""
Dataset upload & analysis router.

POST /analysis/upload       — CSV dosyaları yükle, in-memory analiz et
GET  /analysis/samples      — Mevcut örnek datasetleri listele
POST /analysis/samples/{name} — Hazır örnek dataseti analiz et
"""

import csv
import io
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, UploadFile, HTTPException
from services.dataset_analysis import calculate_metrics_from_dicts

router = APIRouter(prefix="/analysis", tags=["analysis"])

SAMPLES_DIR = Path(__file__).parent.parent / "data" / "samples"

SAMPLE_META = {
    "high_risk": {
        "label": "Yüksek Riskli Bağlam",
        "description": (
            "PUBLIC_WIFI + NEW_DEVICE + OFF_HOURS koşulunda 10 katılımcı, 50 senaryo çalıştırması. "
            "Tüm senaryolarda HIGH uyarı seviyesi. "
            "Literatür bazlı: bypass ~%45, NASA-TLX ~65, uyarı okuma ~12s "
            "(BYU Neurosecurity Lab; MDPI Sensors 2021)."
        ),
        "context": "PUBLIC_WIFI + NEW_DEVICE + OFF_HOURS",
        "n_sessions": 10,
        "reference": "BYU Neurosecurity Lab (2018); MDPI Sensors 21(21):7313 (2021)",
    },
    "low_risk": {
        "label": "Düşük Riskli Bağlam",
        "description": (
            "CORPORATE + KNOWN_DEVICE + BUSINESS_HOURS koşulunda 10 katılımcı, 50 senaryo çalıştırması. "
            "Hiç uyarı gösterilmez (NONE). Kullanıcılar güvensiz eylemlere doğal olarak yönelir. "
            "Literatür bazlı: unsafe ~%70, NASA-TLX ~28 "
            "(Security Journal 2020; Egelman & Yang 2015)."
        ),
        "context": "CORPORATE + KNOWN_DEVICE + BUSINESS_HOURS",
        "n_sessions": 10,
        "reference": "Security Journal (2020); Egelman & Yang, USENIX SOUPS 2015",
    },
    "mixed": {
        "label": "Karma / Gerçekçi Profil",
        "description": (
            "Karma bağlam profillerine sahip 20 katılımcı, 100 senaryo çalıştırması. "
            "NONE/LOW/MEDIUM/HIGH uyarı seviyeleri karışık. "
            "Gerçek bir alan çalışmasının tipik dağılımını temsil eder. "
            "Literatür bazlı: bypass ~%30, NASA-TLX ~48."
        ),
        "context": "Karma (NONE %20, LOW %20, MEDIUM %30, HIGH %30)",
        "n_sessions": 20,
        "reference": "Habituation effect meta-analysis; Felt et al. CHI 2012",
    },
}


# ─── CSV yardımcıları ─────────────────────────────────────────────────────────

async def _parse_csv(upload: UploadFile) -> tuple[list[dict], list[str]]:
    """CSV dosyasını dict listesine çevirir. (rows, warnings) döndürür."""
    warnings = []
    content = await upload.read()
    try:
        text = content.decode("utf-8-sig")  # BOM tolerans
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for i, row in enumerate(reader, start=2):
        rows.append({k.strip(): v.strip() for k, v in row.items()})

    if not rows:
        warnings.append(f"{upload.filename}: Dosya boş veya başlık satırı yok.")
    return rows, warnings


def _read_sample_csv(name: str, filename: str) -> list[dict]:
    path = SAMPLES_DIR / name / filename
    if not path.exists():
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def _validate_scenario_runs(rows: list[dict]) -> list[str]:
    required = {"outcome", "risk_score", "warning_level"}
    if not rows:
        return []
    cols = set(rows[0].keys())
    missing = required - cols
    warnings = []
    if missing:
        warnings.append(
            f"scenario_runs.csv: Eksik sütunlar: {', '.join(missing)}. "
            "Bu sütunlar olmadan bazı metrikler hesaplanamaz."
        )
    valid_outcomes = {"COMPLETED_SAFE", "UNSAFE_ACTION", "BYPASSED", "ABANDONED", ""}
    invalid = [r.get("outcome", "") for r in rows if r.get("outcome", "") not in valid_outcomes]
    if invalid:
        warnings.append(
            f"scenario_runs.csv: {len(invalid)} satırda geçersiz 'outcome' değeri — atlandı."
        )
    return warnings


# ─── Endpoint'ler ─────────────────────────────────────────────────────────────

@router.post("/upload")
async def upload_and_analyze(
    scenario_runs: UploadFile = File(..., description="scenario_runs.csv (zorunlu)"),
    events: Optional[UploadFile] = File(None, description="events.csv (opsiyonel)"),
    surveys: Optional[UploadFile] = File(None, description="surveys.csv (opsiyonel)"),
    nasa_tlx: Optional[UploadFile] = File(None, description="nasa_tlx.csv (opsiyonel)"),
):
    """
    CSV dosyalarını yükle ve in-memory metrik analizi yap.
    Yalnızca scenario_runs zorunludur; diğerleri ek metrik gruplarını açar.
    """
    validation_warnings: list[str] = []

    runs_rows, w = await _parse_csv(scenario_runs)
    validation_warnings.extend(w)
    validation_warnings.extend(_validate_scenario_runs(runs_rows))

    events_rows = []
    if events and events.filename:
        events_rows, w = await _parse_csv(events)
        validation_warnings.extend(w)

    surveys_rows = []
    if surveys and surveys.filename:
        surveys_rows, w = await _parse_csv(surveys)
        validation_warnings.extend(w)

    tlx_rows = []
    if nasa_tlx and nasa_tlx.filename:
        tlx_rows, w = await _parse_csv(nasa_tlx)
        validation_warnings.extend(w)

    metrics = calculate_metrics_from_dicts(
        scenario_runs=runs_rows,
        events=events_rows or None,
        surveys=surveys_rows or None,
        nasa_tlx=tlx_rows or None,
    )

    return {
        "source": "upload",
        "filename": scenario_runs.filename,
        "metrics": metrics,
        "validation_warnings": validation_warnings,
    }


@router.get("/samples")
def list_samples():
    """Mevcut örnek datasetlerin listesini ve meta verilerini döndürür."""
    result = []
    for name, meta in SAMPLE_META.items():
        sample_path = SAMPLES_DIR / name
        files = [f.name for f in sample_path.glob("*.csv")] if sample_path.exists() else []
        result.append({
            "name": name,
            "files": sorted(files),
            **meta,
        })
    return result


@router.post("/samples/{name}")
def analyze_sample(name: str):
    """Hazır örnek dataseti dosya yüklemeden analiz et."""
    if name not in SAMPLE_META:
        raise HTTPException(
            status_code=404,
            detail=f"Örnek dataset bulunamadı: '{name}'. "
                   f"Mevcut seçenekler: {list(SAMPLE_META.keys())}",
        )

    runs = _read_sample_csv(name, "scenario_runs.csv")
    events = _read_sample_csv(name, "events.csv")
    surveys = _read_sample_csv(name, "surveys.csv")
    tlx = _read_sample_csv(name, "nasa_tlx.csv")

    if not runs:
        raise HTTPException(status_code=500, detail="Örnek dataset okunamadı.")

    metrics = calculate_metrics_from_dicts(
        scenario_runs=runs,
        events=events or None,
        surveys=surveys or None,
        nasa_tlx=tlx or None,
    )

    return {
        "source": "sample",
        "sample_name": name,
        "sample_label": SAMPLE_META[name]["label"],
        "sample_reference": SAMPLE_META[name]["reference"],
        "metrics": metrics,
        "validation_warnings": [],
    }
