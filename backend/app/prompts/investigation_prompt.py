SYSTEM_INVESTIGATION_PROMPT = """You are SENTINEL MEMORY, an advanced AI Security Operations Center (SOC) agent.
Your primary role is to investigate security alerts by combining CURRENT ALERT EVIDENCE with the organization's institutional memories recalled from Hindsight.

CRITICAL RULES:
1. STRICT SEPARATION OF EVIDENCE:
   - "CURRENT ALERT EVIDENCE": Only facts, indicators, processes, hosts, and timestamps from the incoming alert.
   - "HISTORICAL MEMORY": Institutional knowledge, previous incident resolutions, known enterprise software, past analyst verdicts, or approved exceptions recalled from Hindsight.
   - NEVER attribute a historical memory event or endpoint to the current alert.
   - NEVER fabricate historical incidents that were not provided in the recalled memories context.

2. LEARNING FROM MEMORY:
   - If historical memories show a pattern was previously classified as a FALSE POSITIVE or legitimate business tool (e.g. approved backup scripts, IT deployment, authorized pentesting), evaluate whether the current alert matches those specific parameters.
   - If historical memories show a pattern led to credential theft, ransomware, or persistence, highlight the similarity and recommend proportional defensive containment.
   - If NO memories are provided, assess the alert strictly based on standard defensive cybersecurity principles, and note that no organizational context was available.

3. STRUCTURED JSON OUTPUT:
   You must respond with valid JSON ONLY (no markdown code blocks, no backticks, no extra text before or after).
   The JSON object must match this schema:
   {
     "alert_id": "string",
     "risk_level": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL",
     "confidence": float (between 0.0 and 1.0),
     "summary": "Executive summary of the alert and findings in 2-3 sentences",
     "key_indicators": ["Indicator 1", "Indicator 2", ...],
     "historical_matches": [
       {
         "memory_id": "string",
         "incident_id": "string",
         "similarity_reason": "Clear explanation of why this memory relates to the alert",
         "historical_outcome": "How the organization resolved the past incident"
       }
     ],
     "reasoning": [
       "Current Alert Evidence: ...",
       "Historical Context: ...",
       "Synthesis & Differential Assessment: ..."
     ],
     "recommended_actions": [
       "Immediate action 1",
       "Investigation step 2",
       "Remediation step 3"
     ],
     "memory_used": true | false,
     "memory_count": int
   }

4. DEFENSIVE & SAFE:
   All recommended actions must be defensive, containment-focused, and standard SOC procedures.
"""

def build_user_investigation_prompt(alert_dict: dict, recalled_memories: list, reflection_summary: str = None) -> str:
    memories_text = ""
    if recalled_memories:
        memories_text = "### RECALLED HINDSIGHT ORGANIZATIONAL MEMORIES:\n"
        for i, m in enumerate(recalled_memories, 1):
            mem_id = m.get("id") or f"mem-{i}"
            doc_id = m.get("document_id") or m.get("metadata", {}).get("incident_id", f"INC-HIST-{i}")
            text = m.get("text", "")
            meta = m.get("metadata", {})
            tags = m.get("tags", [])
            score = m.get("score", 0.0)
            memories_text += f"\n--- MEMORY #{i} [ID: {mem_id} | Ref: {doc_id} | Score: {score:.2f}] ---\n"
            if tags:
                memories_text += f"Tags: {', '.join(tags)}\n"
            if meta:
                memories_text += f"Metadata: {meta}\n"
            memories_text += f"Content:\n{text}\n"
    else:
        memories_text = "### RECALLED HINDSIGHT ORGANIZATIONAL MEMORIES:\n[No matching historical memories found in Hindsight memory bank for this alert query.]\n"

    reflection_text = ""
    if reflection_summary:
        reflection_text = f"\n### HINDSIGHT REFLECT SYNTHESIS (ORGANIZATIONAL MENTAL MODEL):\n{reflection_summary}\n"

    alert_details = f"""### CURRENT ALERT TO INVESTIGATE:
Alert ID: {alert_dict.get('alert_id')}
Host: {alert_dict.get('host')}
Severity: {alert_dict.get('severity')}
Process: {alert_dict.get('process')}
Parent Process: {alert_dict.get('parent_process')}
Command: {alert_dict.get('command')}
Destination: {alert_dict.get('destination') or 'None'}
Timestamp: {alert_dict.get('timestamp') or 'Current Session'}
User Context: {alert_dict.get('user') or 'N/A'}
Raw Log: {alert_dict.get('raw_log') or 'N/A'}
"""

    return f"""{alert_details}

{memories_text}
{reflection_text}

INSTRUCTIONS:
Analyze the current alert using the provided historical memories from Hindsight.
Determine if past organizational experience changes or refines the risk assessment (e.g. recognized enterprise automation vs genuine attack).
Output ONLY the JSON object.
"""
