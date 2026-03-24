from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import sessions, scenarios, surveys, dashboard, analysis

app = FastAPI(
    title="Context-Aware Security Simulation Platform",
    description=(
        "Scientific simulation platform for testing user security behaviours "
        "under varying context conditions (network, device, time, behavioural)."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(scenarios.router)
app.include_router(surveys.router)
app.include_router(dashboard.router)
app.include_router(analysis.router)


@app.on_event("startup")
def startup_event():
    init_db()


@app.get("/")
def root():
    return {
        "service": "Context-Aware Security Simulation Platform",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
