import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, symptoms, triggers, assessments, predictions, health_metrics, oauth, chat, reports

logger = logging.getLogger(__name__)


_NEW_COLS = {
    "profile_completed": "BOOLEAN DEFAULT 0",
    "gender": "VARCHAR",
    "occupation": "VARCHAR",
    "height": "VARCHAR",
    "weight": "VARCHAR",
    "hearing_aid": "VARCHAR",
    "existing_conditions": "TEXT",
    "medications": "TEXT",
    "family_history": "TEXT",
    "allergies": "TEXT",
    "affected_ear": "VARCHAR",
    "sound_type": "VARCHAR",
    "tinnitus_duration": "VARCHAR",
    "tinnitus_onset": "VARCHAR",
    "severity_rating": "VARCHAR",
    "smoking": "VARCHAR",
    "alcohol": "VARCHAR",
    "caffeine": "VARCHAR",
    "substance_consumption": "VARCHAR",
    "exercise": "VARCHAR",
}

_ASSESSMENT_NEW_COLS = {
    "doctor_notes": "TEXT",
}

_SYMPTOM_NEW_COLS = {
    "intensity_db": "FLOAT",
}


def _ensure_column(table: str, col: str, coltype: str) -> bool:
    """Add a missing column to a table, compatible with SQLite and Postgres."""
    try:
        from sqlalchemy import inspect

        with engine.connect() as conn:
            inspector = inspect(conn)
            existing = {c["name"] for c in inspector.get_columns(table)}
            if col in existing:
                return False
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {coltype}"))
            conn.commit()
            logger.info(f"Added missing column: {table}.{col}")
            return True
    except Exception as e:
        logger.warning(f"Could not add column {table}.{col}: {e}")
        return False


def _migrate_schema():
    try:
        for col, coltype in _NEW_COLS.items():
            _ensure_column("patient_profiles", col, coltype)
        for col, coltype in _ASSESSMENT_NEW_COLS.items():
            _ensure_column("risk_assessments", col, coltype)
        for col, coltype in _SYMPTOM_NEW_COLS.items():
            _ensure_column("symptom_records", col, coltype)
        logger.info("Schema migration complete")
    except Exception as e:
        logger.warning(f"Migration note: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            Base.metadata.create_all(bind=engine)
            _migrate_schema()
            logger.info("Database connected and tables synced")
    except Exception as e:
        logger.warning(f"Database unavailable at startup: {e}")
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(symptoms.router, prefix="/api/v1")
app.include_router(triggers.router, prefix="/api/v1")
app.include_router(assessments.router, prefix="/api/v1")
app.include_router(predictions.router, prefix="/api/v1")
app.include_router(health_metrics.router, prefix="/api/v1")
app.include_router(oauth.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(reports.router, prefix="/api/v1")


@app.get("/health")
def health_check():
    db_status = "unknown"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"
    return {"status": "healthy", "service": settings.APP_NAME, "database": db_status}
