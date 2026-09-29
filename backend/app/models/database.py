from datetime import datetime, timezone
import json
import os
import shutil
import logging
from pathlib import Path
from sqlalchemy import create_engine, Column, String, Integer, Float, Text, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger("sentinel.database")

def utc_now():
    return datetime.now(timezone.utc)

def resolve_database_url() -> str:
    is_serverless = bool(
        os.environ.get("VERCEL") or 
        os.environ.get("VERCEL_ENV") or
        os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or
        os.environ.get("LAMBDA_TASK_ROOT")
    )
    if is_serverless:
        return "sqlite:///:memory:?check_same_thread=False"
    return settings.DATABASE_URL

DATABASE_URL = resolve_database_url()

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class AlertRecord(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True, index=True) # e.g. ALT-1042
    timestamp = Column(DateTime, default=utc_now)
    host = Column(String, index=True)
    severity = Column(String, index=True)
    process = Column(String)
    parent_process = Column(String)
    command = Column(Text)
    destination = Column(String, nullable=True)
    raw_payload = Column(Text) # JSON string
    created_at = Column(DateTime, default=utc_now)

class InvestigationRecord(Base):
    __tablename__ = "investigations"

    id = Column(String, primary_key=True, index=True)
    alert_id = Column(String, index=True)
    risk_level = Column(String)
    confidence = Column(Float)
    summary = Column(Text)
    key_indicators = Column(Text) # JSON array
    historical_matches = Column(Text) # JSON array
    reasoning = Column(Text) # JSON array
    recommended_actions = Column(Text) # JSON array
    memory_used = Column(Boolean, default=False)
    memory_count = Column(Integer, default=0)
    memory_status = Column(String) # CONNECTED / UNAVAILABLE / EMPTY
    hindsight_reflection = Column(Text, nullable=True) # Synthesized mental model from Hindsight reflect
    created_at = Column(DateTime, default=utc_now)

class FeedbackRecord(Base):
    __tablename__ = "feedbacks"

    id = Column(String, primary_key=True, index=True)
    alert_id = Column(String, index=True)
    investigation_id = Column(String, nullable=True)
    verdict = Column(String) # CORRECT / FALSE_POSITIVE / ESCALATE / NEEDS_REVIEW
    analyst_name = Column(String, default="SOC Lead Analyst")
    comments = Column(Text)
    action_taken = Column(String, nullable=True)
    retained_in_hindsight = Column(Boolean, default=False)
    hindsight_operation_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)

def init_db():
    try:
        url = DATABASE_URL
        if "sqlite:////tmp/sentinel.db" in url:
            tmp_db = Path("/tmp/sentinel.db")
            if not tmp_db.exists():
                candidate_paths = [
                    Path(__file__).resolve().parent.parent.parent / "sentinel.db",
                    Path(__file__).resolve().parent.parent.parent.parent / "sentinel.db",
                    Path.cwd() / "sentinel.db",
                    Path.cwd() / "backend" / "sentinel.db"
                ]
                for p in candidate_paths:
                    if p.exists() and p.is_file() and p.stat().st_size > 0:
                        try:
                            shutil.copy2(str(p), str(tmp_db))
                            logger.info(f"Initialized /tmp/sentinel.db from existing seed: {p}")
                            break
                        except Exception as ce:
                            logger.warning(f"Could not copy database from {p}: {ce}")

        Base.metadata.create_all(bind=engine)
        logger.info(f"Database tables initialized successfully with URL: {url}")
    except Exception as e:
        logger.warning(f"Database initialization encountered non-fatal error: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
