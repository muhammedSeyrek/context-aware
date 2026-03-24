# Context-Aware Security Simulation Platform

Bağlama duyarlı (context-aware) güvenlik davranışı araştırması için bilimsel simülasyon platformu.

## Mimari

```
context-aware/
├── backend/   # FastAPI + SQLAlchemy + SQLite
└── frontend/  # React (Vite) + Recharts
```

## Hızlı Başlangıç

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

## Katılımcı Akışı

1. Karşılama & onam → 2. 5 senaryo (her biri sonrası mini anket) → 3. NASA-TLX → 4. Teşekkür

## Araştırmacı Paneli

`http://localhost:5173/dashboard`

## Senaryolar

| Senaryo | Açıklama |
|---------|----------|
| Phishing E-postası | Sahte inbox UI, hover'da link preview |
| Yeni Cihaz Girişi | Bilinmeyen cihazdan giriş onaylama |
| Hassas Dosya Paylaşımı | Gizli belge e-posta ile paylaşımı |
| Public Wi-Fi Erişimi | Açık ağdan kurumsal sistem erişimi |
| Anormal İndirme | Gece saatinde büyük veri paketi indirme |

## Metrikler

**Güvenlik:** unsafe_action_rate, detection_rate, false_positive_rate
**İnsan-merkezli:** perceived_friction, trust_score, task_completion_time, warning_adherence_rate, bypass_rate, abandonment_rate, NASA-TLX
**Davranışsal:** warning_reading_time, dismiss_time, return_rate, behavior_change_rate

## Testler

```bash
cd backend
pytest tests/ -v
```
