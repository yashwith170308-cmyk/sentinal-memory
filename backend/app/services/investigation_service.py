import time
import json
import logging
import uuid
from typing import Dict, Any, List
from datetime import datetime

from backend.app.schemas.alert import AlertInput
from backend.app.schemas.investigation import InvestigationResult, HistoricalMatch
from backend.app.services.hindsight_service import hindsight_service
from backend.app.services.llm_service import llm_service
from backend.app.models.database import SessionLocal, AlertRecord, InvestigationRecord

logger = logging.getLogger("sentinel.investigation")

class InvestigationService:
    def construct_recall_query(self, alert: AlertInput) -> str:
        """
        Step 2: Construct a high-signal semantic query tailored for Hindsight recall.
        Emphasizes process hierarchy, behaviors, flags, and potential false-positive contexts.
        """
        parent = alert.parent_process or "unknown parent"
        proc = alert.process or "unknown process"
        cmd = alert.command or ""
        host = alert.host or ""
        dest = alert.destination or ""

        behaviors = []
        if "-enc" in cmd.lower() or "base64" in cmd.lower() or "encoded" in cmd.lower():
            behaviors.append("encoded commands and script obfuscation")
        if "winword" in parent.lower() or "excel" in parent.lower() or "outlook" in parent.lower():
            behaviors.append("Office document spawning shell or script interpreter")
        if "backup" in cmd.lower():
            behaviors.append("scheduled enterprise backup job routine")
        if "curl" in cmd.lower() or "wget" in cmd.lower() or "downloadstring" in cmd.lower():
            behaviors.append("remote payload retrieval or download activity")
        if dest and dest != "None":
            behaviors.append(f"external outbound network telemetry to {dest}")

        behavior_str = ", ".join(behaviors) if behaviors else "process execution and command line telemetry"

        query = (
            f"Previous incidents, security alerts, and analyst feedback involving {proc} spawned by {parent}. "
            f"Patterns include: {behavior_str}. Search for related attack techniques, malicious office macros, "
            f"credential theft attempts, endpoint isolation actions, as well as approved IT administrative automation "
            f"and analyst false positive determinations for host {host}."
        )
        return query

    def investigate(self, alert: AlertInput) -> InvestigationResult:
        """
        Executes the end-to-end investigation pipeline.
        """
        start_time = time.time()
        logger.info(f"Starting investigation for Alert: {alert.alert_id} ({alert.host})")

        # Step 1: Parse and normalize alert
        alert_dict = alert.model_dump()

        # Step 2: Build memory query
        memory_query = self.construct_recall_query(alert)
        logger.info(f"Constructed Hindsight recall query: {memory_query}")

        # Step 3: Recall memories from Hindsight
        memory_status = "CONNECTED" if hindsight_service.is_available() else "UNAVAILABLE"
        recalled_memories = []
        reflection_summary = None

        if hindsight_service.is_available():
            try:
                recalled_memories = hindsight_service.recall(
                    query=memory_query,
                    max_tokens=4096,
                    budget="mid"
                )
                if not recalled_memories:
                    memory_status = "NO_RELEVANT_MEMORIES"

                # Optionally call reflect if useful
                try:
                    reflection_summary = hindsight_service.reflect(
                        query=f"What organizational policies or patterns exist for {alert.process} spawned by {alert.parent_process}?"
                    )
                except Exception as ref_err:
                    logger.debug(f"Reflect call skipped: {ref_err}")
            except Exception as e:
                logger.error(f"Hindsight recall error: {e}")
                memory_status = "UNAVAILABLE"
        else:
            logger.warning("Hindsight memory unavailable — investigation running without organizational memory.")
            memory_status = "UNAVAILABLE"

        # Step 4 & 5: LLM / Heuristic Investigation
        analysis_raw = llm_service.analyze_alert(
            alert_dict=alert_dict,
            recalled_memories=recalled_memories,
            reflection_summary=reflection_summary
        )

        execution_time_ms = round((time.time() - start_time) * 1000, 2)
        inv_id = f"INV-{uuid.uuid4().hex[:8].upper()}"

        # Format historical matches with genuine Hindsight memory evidence
        matches = []
        recalled_by_id = {mem["id"]: mem for mem in recalled_memories if mem.get("id")}
        recalled_by_doc = {}
        for mem in recalled_memories:
            doc_id = mem.get("document_id") or mem.get("metadata", {}).get("incident_id")
            if doc_id:
                recalled_by_doc[doc_id] = mem

        for m in analysis_raw.get("historical_matches", []):
            raw_mem_id = m.get("memory_id")
            raw_inc_id = m.get("incident_id")
            real_mem = recalled_by_id.get(raw_mem_id) or recalled_by_doc.get(raw_inc_id)

            actual_uuid = (real_mem.get("id") if real_mem else None) or (raw_mem_id if raw_mem_id and not raw_mem_id.startswith("mem-") else "")
            actual_score = (real_mem.get("score") if real_mem else None) or m.get("confidence_score")
            actual_text = (real_mem.get("text") if real_mem else None) or m.get("text")
            actual_tags = (real_mem.get("tags") if real_mem else None) or m.get("tags", [])

            matches.append(HistoricalMatch(
                memory_id=actual_uuid,
                incident_id=raw_inc_id or (real_mem.get("document_id") if real_mem else "INC-HIST"),
                title=m.get("title") or f"Incident {m.get('incident_id')}",
                similarity_reason=m.get("similarity_reason", "Historical pattern similarity detected"),
                historical_outcome=m.get("historical_outcome", "Resolved by SOC"),
                confidence_score=actual_score,
                tags=actual_tags,
                text=actual_text
            ))

        # Build validated result
        result = InvestigationResult(
            alert_id=alert.alert_id,
            risk_level=analysis_raw.get("risk_level", alert.severity),
            confidence=float(analysis_raw.get("confidence", 0.85)),
            summary=analysis_raw.get("summary", "Investigation completed."),
            key_indicators=analysis_raw.get("key_indicators", []),
            historical_matches=matches,
            reasoning=analysis_raw.get("reasoning", []),
            recommended_actions=analysis_raw.get("recommended_actions", []),
            memory_used=len(recalled_memories) > 0,
            memory_count=len(recalled_memories),
            memory_status=memory_status,
            hindsight_reflection=reflection_summary,
            execution_time_ms=execution_time_ms,
            investigation_id=inv_id
        )

        # Persist alert & investigation in local DB
        self._persist_records(alert, result)

        return result

    def _persist_records(self, alert: AlertInput, result: InvestigationResult):
        """Persists alert and investigation into SQLite for history and demo navigation."""
        try:
            with SessionLocal() as db:
                # Save or update Alert
                alert_record = db.query(AlertRecord).filter(AlertRecord.id == alert.alert_id).first()
                if not alert_record:
                    alert_record = AlertRecord(
                        id=alert.alert_id,
                        host=alert.host,
                        severity=alert.severity,
                        process=alert.process,
                        parent_process=alert.parent_process,
                        command=alert.command,
                        destination=alert.destination,
                        raw_payload=json.dumps(alert.model_dump())
                    )
                    db.add(alert_record)

                # Save Investigation
                inv_record = InvestigationRecord(
                    id=result.investigation_id,
                    alert_id=result.alert_id,
                    risk_level=result.risk_level,
                    confidence=result.confidence,
                    summary=result.summary,
                    key_indicators=json.dumps(result.key_indicators),
                    historical_matches=json.dumps([m.model_dump() for m in result.historical_matches]),
                    reasoning=json.dumps(result.reasoning),
                    recommended_actions=json.dumps(result.recommended_actions),
                    memory_used=result.memory_used,
                    memory_count=result.memory_count,
                    memory_status=result.memory_status,
                    hindsight_reflection=result.hindsight_reflection
                )
                db.add(inv_record)
                db.commit()
        except Exception as e:
            logger.error(f"Error persisting investigation to database: {e}")

investigation_service = InvestigationService()
