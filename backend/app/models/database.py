from datetime import datetime, timezone
import json
from sqlalchemy import create_engine, Column, String, Integer, Float, Text, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

def utc_now():
    return datetime.now(timezone.utc)

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
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
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
