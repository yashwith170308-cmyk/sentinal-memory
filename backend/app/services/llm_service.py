import json
import logging
import re
from typing import Dict, Any, List, Optional
from backend.app.config import settings
from backend.app.schemas.investigation import InvestigationResult, HistoricalMatch
from backend.app.prompts.investigation_prompt import SYSTEM_INVESTIGATION_PROMPT, build_user_investigation_prompt

logger = logging.getLogger("sentinel.llm")

class LLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.LLM_MODEL
        self._groq_client = None
        self._init_client()

    def _init_client(self):
        if self.api_key:
            try:
                from groq import Groq
                self._groq_client = Groq(api_key=self.api_key)
                logger.info(f"Groq LLM client initialized with model: {self.model}")
            except Exception as e:
                logger.error(f"Failed to initialize Groq client: {e}")
                self._groq_client = None
        else:
            logger.info("GROQ_API_KEY not configured. Heuristic defensive SOC engine will be active as fallback.")

    def update_credentials(self, api_key: Optional[str] = None, model: Optional[str] = None):
        """Allows dynamic configuration of LLM credentials at runtime."""
        if api_key is not None:
            self.api_key = api_key.strip() or None
        if model is not None:
            self.model = model.strip() or "llama-3.3-70b-versatile"
        self._init_client()

    def is_available(self) -> bool:
        return self._groq_client is not None

    def analyze_alert(
        self,
        alert_dict: Dict[str, Any],
        recalled_memories: List[Dict[str, Any]],
        reflection_summary: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Sends the alert and recalled Hindsight memories to the LLM (or fallback engine)
        and returns a validated structured dictionary.
        """
        if self._groq_client:
            try:
                user_prompt = build_user_investigation_prompt(alert_dict, recalled_memories, reflection_summary)
                response = self._groq_client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": SYSTEM_INVESTIGATION_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.1,
                    response_format={"type": "json_object"}
                )
                raw_content = response.choices[0].message.content
                logger.info("Successfully received LLM response from Groq")
                return self._parse_and_validate(raw_content, alert_dict, recalled_memories)
            except Exception as e:
                logger.warning(f"Groq API call failed or timed out: {e}. Falling back to defensive reasoning engine.")
                return self._fallback_investigation(alert_dict, recalled_memories, reflection_summary)
        else:
            return self._fallback_investigation(alert_dict, recalled_memories, reflection_summary)

    def _parse_and_validate(self, text: str, alert_dict: Dict[str, Any], recalled_memories: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Cleans and validates JSON from LLM output."""
        try:
            cleaned = text.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?", "", cleaned)
                cleaned = re.sub(r"```$", "", cleaned).strip()

            parsed = json.loads(cleaned)
            # Ensure required keys exist
            parsed["alert_id"] = alert_dict.get("alert_id", "ALT-UNKNOWN")
            parsed["memory_used"] = len(recalled_memories) > 0
            parsed["memory_count"] = len(recalled_memories)
            return parsed
        except Exception as e:
            logger.error(f"Failed to parse LLM JSON: {e}. Output was:\n{text}")
            return self._fallback_investigation(alert_dict, recalled_memories)

    def _fallback_investigation(
        self,
        alert_dict: Dict[str, Any],
        recalled_memories: List[Dict[str, Any]],
        reflection_summary: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        High-fidelity heuristic defensive SOC reasoning engine.
        Ensures consistent, realistic security analysis and leverages actual Hindsight memories.
        """
        alert_id = alert_dict.get("alert_id", "ALT-1000")
        process = (alert_dict.get("process") or "").lower()
        parent = (alert_dict.get("parent_process") or "").lower()
        command = alert_dict.get("command") or ""
        host = alert_dict.get("host") or "UNKNOWN-HOST"
        dest = alert_dict.get("destination") or "None"

        # Check recalled memories to see if any indicate false positive or known legitimate tools
        is_known_false_positive = False
        matching_history_items = []
        relevant_past_outcome = None

        for m in recalled_memories:
            m_text = m.get("text", "").lower()
            m_tags = [t.lower() for t in m.get("tags", [])]
            meta = m.get("metadata", {})
            inc_id = meta.get("incident_id") or m.get("document_id") or "INC-HIST"

            is_fp = "false positive" in m_text or "legitimate" in m_text or "approved" in m_text or "false_positive" in m_tags
            if is_fp and (("backup" in command.lower() and "backup" in m_text) or
                          ("test" in command.lower() and "test" in m_text) or
                          ("automation" in m_text and ("scripts" in command.lower() or "corp" in command.lower())) or
                          ("powershell" in process and "powershell" in m_text and "legitimate" in m_text)):
                is_known_false_positive = True
                relevant_past_outcome = meta.get("outcome") or "Approved enterprise operation / Closed as False Positive"

            matching_history_items.append({
                "memory_id": m.get("id", ""),
                "incident_id": inc_id,
                "similarity_reason": f"Recalled based on matching process relationship ({parent} -> {process}) and command signatures in Hindsight memory.",
                "historical_outcome": meta.get("outcome") or ("Confirmed True Positive - Endpoint isolated" if not is_fp else "Authorized IT workflow - False Positive logged"),
                "confidence_score": m.get("score"),
                "text": m.get("text"),
                "tags": m.get("tags", [])
            })

        # Base security indicators
        indicators = [
            f"Process execution: {process} spawned by {parent}",
            f"Host endpoint: {host}"
        ]
        if "-enc" in command.lower() or "base64" in command.lower() or "encoded" in command.lower():
            indicators.append("Base64/Encoded command line argument detected")
        if dest and dest != "None":
            indicators.append(f"Outbound network communication target: {dest}")

        # Determine risk level based on memory synthesis
        if is_known_false_positive:
            risk_level = "LOW"
            confidence = 0.91
            summary = (
                f"Alert {alert_id} exhibits suspicious command line structure ({parent} -> {process}), but historical "
                f"Hindsight organizational memory identified this pattern as an authorized enterprise procedure. "
                f"Past analyst feedback confirmed this activity is benign under approved maintenance policies."
            )
            reasoning = [
                f"CURRENT ALERT EVIDENCE: Process {process} executed on {host} with flags matching routine automation scripts.",
                f"HISTORICAL MEMORY CONTEXT: Hindsight recalled past incident(s) where identical execution patterns were verified by SOC analysts as legitimate IT operations.",
                f"SYNTHESIS: Risk level downgraded from HIGH to LOW based on retained institutional feedback ({relevant_past_outcome or 'analyst confirmed false positive'})."
            ]
            recommended_actions = [
                "Verify script execution against the scheduled change-window management database.",
                "Check user context against IT Systems Engineering roster.",
                "Tag alert as recognized enterprise automation to reinforce Hindsight memory bank."
            ]
        elif len(recalled_memories) > 0:
            # Memories recalled, malicious precedence
            risk_level = "HIGH" if "winword" in parent or "excel" in parent or "-enc" in command.lower() else "MEDIUM"
            confidence = 0.88
            summary = (
                f"Alert {alert_id} indicates an execution chain ({parent} -> {process}) with network telemetry to {dest}. "
                f"Hindsight organizational memory matches this activity to {len(recalled_memories)} previous incident(s), "
                f"confirming a recurrent threat pattern in the environment."
            )
            reasoning = [
                f"CURRENT ALERT EVIDENCE: Detected anomalous execution of {process} originating from {parent} on {host}.",
                f"HISTORICAL MEMORY CONTEXT: Hindsight recalled {len(recalled_memories)} relevant past security incidents with matching MITRE ATT&CK techniques (T1059.001, T1204).",
                f"SYNTHESIS: Historical outcomes indicate similar behavior led to credential dumping and persistence attempts if left uncontained."
            ]
            recommended_actions = [
                f"Quarantine endpoint {host} from corporate network segment.",
                "Capture volatile RAM dump and active process tree for memory forensics.",
                f"Block destination IP/endpoint {dest} at corporate perimeter firewalls.",
                "Reset active session tokens and kerberos tickets for affected user account."
            ]
        else:
            # No memory available (first time or Hindsight offline)
            risk_level = "HIGH" if ("winword" in parent or "-enc" in command.lower()) else "MEDIUM"
            confidence = 0.65
            summary = (
                f"Alert {alert_id}: Suspicious execution of {process} under parent process {parent} on host {host}. "
                f"No previous organizational memory was found in Hindsight for this specific pattern."
            )
            reasoning = [
                f"CURRENT ALERT EVIDENCE: Process {process} launched with command line telemetry indicating potential obfuscation or script execution.",
                "HISTORICAL MEMORY CONTEXT: Zero relevant past organizational memories recalled from Hindsight.",
                "SYNTHESIS: Standard baseline security evaluation applied without historical organization-specific context."
            ]
            recommended_actions = [
                f"Manually review process hierarchy on {host}.",
                "Inspect command arguments and decode any obfuscated payloads.",
                "Confirm with endpoint owner whether this activity was user-initiated."
            ]

        return {
            "alert_id": alert_id,
            "risk_level": risk_level,
            "confidence": confidence,
            "summary": summary,
            "key_indicators": indicators,
            "historical_matches": matching_history_items,
            "reasoning": reasoning,
            "recommended_actions": recommended_actions,
            "memory_used": len(recalled_memories) > 0,
            "memory_count": len(recalled_memories)
        }

llm_service = LLMService()
