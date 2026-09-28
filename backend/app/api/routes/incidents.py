import json
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from backend.app.models.database import SessionLocal, AlertRecord, InvestigationRecord, FeedbackRecord
from backend.scripts.seed_data import SYNTHETIC_INCIDENTS

router = APIRouter(prefix="/incidents", tags=["Incidents"])

@router.get("")
def list_incidents(limit: int = 50):
    """
    Returns unified list of historical incidents and investigated alerts.
    """
    results = []

    # First add historical seed incidents
    for inc in SYNTHETIC_INCIDENTS:
        results.append({
            "id": inc["incident_id"],
            "type": "HISTORICAL_INCIDENT",
            "title": inc["title"],
            "severity": inc["severity"],
            "category": inc["category"],
            "host": inc["host"],
            "process": inc["process"],
            "outcome": inc["outcome"],
            "timestamp": inc["timestamp"],
            "tags": inc["tags"]
        })

    # Add investigated live alerts from SQLite
    try:
        with SessionLocal() as db:
            alerts = db.query(AlertRecord).order_by(AlertRecord.created_at.desc()).limit(limit).all()
            for a in alerts:
                # Skip if already in synthetic seeds
                if any(x["id"] == a.id for x in results):
                    continue

                inv = db.query(InvestigationRecord).filter(InvestigationRecord.alert_id == a.id).order_by(InvestigationRecord.created_at.desc()).first()
                fb = db.query(FeedbackRecord).filter(FeedbackRecord.alert_id == a.id).order_by(FeedbackRecord.created_at.desc()).first()

                results.insert(0, {
                    "id": a.id,
                    "type": "INVESTIGATED_ALERT",
                    "title": f"Alert {a.id}: {a.process} on {a.host}",
                    "severity": a.severity,
                    "category": inv.risk_level if inv else a.severity,
                    "host": a.host,
                    "process": a.process,
                    "outcome": fb.comments if fb else (inv.summary if inv else "Investigated"),
                    "timestamp": a.created_at.isoformat() if a.created_at else "",
                    "verdict": fb.verdict if fb else None,
                    "memory_used": inv.memory_used if inv else False,
                    "tags": ["live_alert", a.process.replace(".exe", "")]
                })
    except Exception:
        pass

    return results

@router.get("/{incident_id}")
def get_incident_detail(incident_id: str):
    """
    Returns full details for a given incident or alert.
    """
    # Check synthetic dataset
    for inc in SYNTHETIC_INCIDENTS:
        if inc["incident_id"] == incident_id:
            return {
                "source": "HINDSIGHT_SEED_DATA",
                "incident": inc
            }

    # Check database
    with SessionLocal() as db:
        alert = db.query(AlertRecord).filter(AlertRecord.id == incident_id).first()
        if not alert:
            raise HTTPException(status_code=404, detail="Incident or Alert not found")

        inv = db.query(InvestigationRecord).filter(InvestigationRecord.alert_id == incident_id).order_by(InvestigationRecord.created_at.desc()).first()
        fb = db.query(FeedbackRecord).filter(FeedbackRecord.alert_id == incident_id).order_by(FeedbackRecord.created_at.desc()).first()

        return {
            "source": "DATABASE",
            "alert": {
                "id": alert.id,
                "host": alert.host,
                "severity": alert.severity,
                "process": alert.process,
                "parent_process": alert.parent_process,
                "command": alert.command,
                "destination": alert.destination,
                "created_at": alert.created_at.isoformat() if alert.created_at else None
            },
            "investigation": {
                "id": inv.id if inv else None,
                "risk_level": inv.risk_level if inv else None,
                "confidence": inv.confidence if inv else None,
                "summary": inv.summary if inv else None,
                "key_indicators": json.loads(inv.key_indicators) if inv and inv.key_indicators else [],
                "historical_matches": json.loads(inv.historical_matches) if inv and inv.historical_matches else [],
                "reasoning": json.loads(inv.reasoning) if inv and inv.reasoning else [],
                "recommended_actions": json.loads(inv.recommended_actions) if inv and inv.recommended_actions else [],
                "memory_used": inv.memory_used if inv else False,
                "memory_status": inv.memory_status if inv else "UNKNOWN"
            } if inv else None,
            "feedback": {
                "id": fb.id if fb else None,
                "verdict": fb.verdict if fb else None,
                "comments": fb.comments if fb else None,
                "analyst_name": fb.analyst_name if fb else None,
                "retained_in_hindsight": fb.retained_in_hindsight if fb else False
            } if fb else None
        }
