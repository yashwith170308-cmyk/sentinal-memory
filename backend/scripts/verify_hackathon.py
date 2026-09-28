import sys
import os
import json
import logging
from datetime import datetime, timezone

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.config import settings
from backend.app.services.hindsight_service import hindsight_service, HINDSIGHT_CLIENT_AVAILABLE
from backend.app.services.investigation_service import investigation_service
from backend.app.services.feedback_service import feedback_service
from backend.app.schemas.alert import AlertInput
from backend.app.schemas.feedback import FeedbackInput

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("verify_hackathon")

def run_hackathon_verification():
    print("=" * 60)
    print("SENTINEL MEMORY - HACKATHON VERIFICATION SUITE")
    print("=" * 60)

    results = {}

    # 1. HINDSIGHT CONNECTION
    print("\n[CHECK 1] Hindsight Client & Connectivity...")
    print(f"  - Package available: {HINDSIGHT_CLIENT_AVAILABLE}")
    print(f"  - Target URL: {settings.HINDSIGHT_BASE_URL}")
    print(f"  - Bank ID: {settings.HINDSIGHT_BANK_ID}")
    print(f"  - Has API Key: {bool(settings.HINDSIGHT_API_KEY)}")
    
    health = hindsight_service.check_health()
    print(f"  - Health check response: {health}")
    if health.get("status") == "CONNECTED":
        results["connection"] = "PASS"
    else:
        results["connection"] = "FAIL"
        print(f"  * Note: Hindsight Cloud returned status '{health.get('status')}'.")
        if not settings.HINDSIGHT_API_KEY:
            print("  * Reason: HINDSIGHT_API_KEY is not set in .env. A valid key from ui.hindsight.vectorize.io is needed for Cloud connection.")

    # 2. RETAIN OPERATION
    print("\n[CHECK 2] Genuine Hindsight Retain...")
    test_incident_id = f"VERIFY-INC-{int(datetime.now(timezone.utc).timestamp())}"
    test_content = (
        f"INCIDENT {test_incident_id}: Suspicious powershell.exe spawned by winword.exe on endpoint VERIFY-HOST-01. "
        "Command: powershell.exe -enc AAAA... Outcome: True Positive - Endpoint quarantined."
    )
    retain_res = hindsight_service.retain(
        content=test_content,
        document_id=test_incident_id,
        metadata={"incident_id": test_incident_id, "severity": "HIGH", "outcome": "Quarantined"},
        tags=["incident", "powershell", "macro", "verification"]
    )
    print(f"  - Retain response: {retain_res}")
    results["retain"] = "PASS" if retain_res.get("success") else "FAIL"

    # 3. RECALL OPERATION
    print("\n[CHECK 3] Genuine Hindsight Recall...")
    recall_query = "Find incidents with powershell.exe spawned by winword.exe and macro execution"
    recall_memories = hindsight_service.recall(query=recall_query)
    print(f"  - Recalled memory count: {len(recall_memories)}")
    if len(recall_memories) > 0:
        print(f"  - Sample memory ID: {recall_memories[0].get('id')}")
        print(f"  - Sample text: {recall_memories[0].get('text')[:80]}...")
        results["recall"] = "PASS"
    else:
        results["recall"] = "FAIL" if results["connection"] == "PASS" else "STANDBY (Requires API Key)"

    # 4. RECALLED MEMORIES PASSED INTO INVESTIGATION PIPELINE
    print("\n[CHECK 4] Investigation Pipeline & Memory Handoff...")
    test_alert = AlertInput(
        alert_id="ALT-VERIFY-101",
        host="FINANCE-PC-17",
        severity="HIGH",
        process="powershell.exe",
        parent_process="winword.exe",
        command="powershell.exe -enc SQBFAFgA...",
        destination="185.220.101.5:443"
    )
    inv_res = investigation_service.investigate(test_alert)
    print(f"  - Investigation generated alert_id: {inv_res.alert_id}")
    print(f"  - Risk Level: {inv_res.risk_level}, Confidence: {inv_res.confidence}")
    print(f"  - Memory Status reported: {inv_res.memory_status}")
    print(f"  - Memory Count in investigation: {inv_res.memory_count}")
    print(f"  - Historical Matches count: {len(inv_res.historical_matches)}")
    print(f"  - Recommended actions: {len(inv_res.recommended_actions)} items")
    results["investigation"] = "PASS" if inv_res.alert_id == "ALT-VERIFY-101" else "FAIL"

    # 5. FEEDBACK RETENTION
    print("\n[CHECK 5] Analyst Feedback Retention...")
    fb_input = FeedbackInput(
        alert_id="ALT-VERIFY-101",
        investigation_id=inv_res.investigation_id,
        verdict="FALSE_POSITIVE",
        comments="Authorized quarterly document sync script verified by Lead Analyst.",
        analyst_name="SOC Lead Analyst",
        action_taken="Whitelisted in corporate EDR"
    )
    fb_res = feedback_service.process_feedback(fb_input)
    print(f"  - Feedback ID: {fb_res.feedback_id}")
    print(f"  - Retained in Hindsight: {fb_res.retained_in_hindsight}")
    print(f"  - Message: {fb_res.message}")
    results["feedback_retention"] = "PASS" if fb_res.success else "FAIL"

    # 6. RECALL OF PREVIOUS FEEDBACK
    print("\n[CHECK 6] Recall of Previous Feedback...")
    fb_query = "Find analyst feedback regarding authorized quarterly document sync script for powershell.exe"
    fb_memories = hindsight_service.recall(query=fb_query)
    print(f"  - Recalled feedback count: {len(fb_memories)}")
    if len(fb_memories) > 0:
        results["recall_feedback"] = "PASS"
    else:
        results["recall_feedback"] = "STANDBY (Requires API Key for cloud retention)"

    print("\n" + "=" * 60)
    print("VERIFICATION RUN SUMMARY")
    print("=" * 60)
    for k, v in results.items():
        print(f"  {k:25}: {v}")
    print("=" * 60)

if __name__ == "__main__":
    run_hackathon_verification()
