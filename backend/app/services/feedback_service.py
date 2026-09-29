import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any

from backend.app.schemas.feedback import FeedbackInput, FeedbackResponse
from backend.app.services.hindsight_service import hindsight_service
from backend.app.models.database import SessionLocal, FeedbackRecord, AlertRecord, InvestigationRecord

logger = logging.getLogger("sentinel.feedback")

IN_MEMORY_FEEDBACKS: Dict[str, Any] = {}

class FeedbackService:
    def get_recent_feedback(self, alert_id: str = None):
        if alert_id:
            return IN_MEMORY_FEEDBACKS.get(alert_id)
        return list(IN_MEMORY_FEEDBACKS.values())

    def process_feedback(self, feedback: FeedbackInput) -> FeedbackResponse:
        """
        Processes analyst feedback:
        1. Retrieves alert details from DB or memory to contextualize the narrative.
        2. Constructs a rich narrative for Hindsight retain.
        3. Calls hindsight_service.retain(...) to persist feedback into organizational memory.
        4. Saves feedback record to local DB and in-memory cache.
        """
        feedback_id = f"FB-{uuid.uuid4().hex[:8].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()

        alert_data = {}
        try:
            with SessionLocal() as db:
                alert_rec = db.query(AlertRecord).filter(AlertRecord.id == feedback.alert_id).first()
                if alert_rec:
                    alert_data = {
                        "host": alert_rec.host,
                        "process": alert_rec.process,
                        "parent_process": alert_rec.parent_process,
                        "command": alert_rec.command,
                        "severity": alert_rec.severity,
                        "destination": alert_rec.destination
                    }
        except Exception as db_err:
            logger.warning(f"Could not read alert record from DB: {db_err}")

        # Build natural language narrative for Hindsight retention
        narrative = (
            f"SECURITY ANALYST VERDICT & FEEDBACK for Alert {feedback.alert_id}:\n"
            f"Verdict: {feedback.verdict}\n"
            f"Host Affected: {alert_data.get('host', 'N/A')}\n"
            f"Process Hierarchy: {alert_data.get('parent_process', 'N/A')} spawning {alert_data.get('process', 'N/A')}\n"
            f"Executed Command: {alert_data.get('command', 'N/A')}\n"
            f"Analyst Remarks: {feedback.comments}\n"
            f"Action Taken: {feedback.action_taken or 'Logged in SOC playbook'}\n"
            f"Analyst Sign-off: {feedback.analyst_name} at {now_iso}\n"
            f"Organizational Learning: When similar alerts occur with process {alert_data.get('process')} "
            f"and command patterns matching this behavior, treat according to verdict {feedback.verdict} "
            f"and analyst note: '{feedback.comments}'."
        )

        metadata = {
            "alert_id": feedback.alert_id,
            "verdict": feedback.verdict,
            "type": "analyst_feedback",
            "host": str(alert_data.get("host", "")),
            "process": str(alert_data.get("process", "")),
            "parent_process": str(alert_data.get("parent_process", "")),
            "timestamp": now_iso
        }

        tags = [
            "feedback",
            "analyst_verdict",
            feedback.verdict.lower(),
            (alert_data.get("process") or "powershell").lower().replace(".exe", "")
        ]

        # Retain into Hindsight long-term memory
        hindsight_result = hindsight_service.retain(
            content=narrative,
            document_id=f"FEEDBACK-{feedback.alert_id}",
            metadata=metadata,
            tags=tags,
            context=f"Analyst feedback on {feedback.alert_id} - Verdict: {feedback.verdict}"
        )

        retained = hindsight_result.get("success", False)
        op_id = hindsight_result.get("operation_id")

        # Save to in-memory session cache for instant recall in Demo Mode
        IN_MEMORY_FEEDBACKS[feedback.alert_id] = {
            "feedback_id": feedback_id,
            "alert_id": feedback.alert_id,
            "verdict": feedback.verdict,
            "comments": feedback.comments,
            "analyst_name": feedback.analyst_name,
            "action_taken": feedback.action_taken,
            "retained_in_hindsight": retained,
            "hindsight_operation_id": str(op_id) if op_id else None,
            "timestamp": now_iso
        }

        # Persist feedback locally
        try:
            with SessionLocal() as db:
                fb_record = FeedbackRecord(
                    id=feedback_id,
                    alert_id=feedback.alert_id,
                    investigation_id=feedback.investigation_id,
                    verdict=feedback.verdict,
                    analyst_name=feedback.analyst_name or "SOC Lead Analyst",
                    comments=feedback.comments,
                    action_taken=feedback.action_taken,
                    retained_in_hindsight=retained,
                    hindsight_operation_id=str(op_id) if op_id else None
                )
                db.add(fb_record)
                db.commit()
        except Exception as e:
            logger.error(f"Error persisting feedback to SQLite: {e}")

        msg = (
            f"Analyst feedback saved and successfully retained into Hindsight memory bank '{hindsight_service.bank_id}'."
            if retained else
            "Feedback recorded locally. Hindsight memory was unavailable for retention."
        )

        return FeedbackResponse(
            success=True,
            feedback_id=feedback_id,
            alert_id=feedback.alert_id,
            retained_in_hindsight=retained,
            hindsight_operation_id=str(op_id) if op_id else None,
            message=msg
        )

feedback_service = FeedbackService()
