import sys
import os
import json
import time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.schemas.alert import AlertInput
from backend.app.schemas.feedback import FeedbackInput
from backend.app.services.investigation_service import investigation_service
from backend.app.services.feedback_service import feedback_service
from backend.app.services.hindsight_service import hindsight_service

def verify_feedback_loop():
    print("=" * 65)
    print("STEP 1: SUBMITTING ANALYST FEEDBACK TO HINDSIGHT")
    print("=" * 65)

    fb_input = FeedbackInput(
        alert_id="ALT-1088",
        verdict="FALSE_POSITIVE",
        comments="Confirmed authorized doc archiver script executed by IT Engineering service account.",
        analyst_name="Lead SOC Analyst",
        action_taken="Approved corporate template sync exception"
    )

    fb_res = feedback_service.process_feedback(fb_input)
    print(f"Feedback ID: {fb_res.feedback_id}")
    print(f"Retained in Hindsight Cloud: {fb_res.retained_in_hindsight}")
    print(f"Message: {fb_res.message}")

    if not fb_res.retained_in_hindsight:
        print("ERROR: Feedback failed to retain in Hindsight Cloud!")
        return False

    print("\nWaiting 2 seconds for Hindsight memory indexing...")
    time.sleep(2)

    print("\n" + "=" * 65)
    print("STEP 2: RUNNING SECOND INVESTIGATION (ALT-1140)")
    print("=" * 65)

    alert2 = AlertInput(
        alert_id="ALT-1140",
        host="FINANCE-PC-18",
        severity="HIGH",
        process="powershell.exe",
        parent_process="winword.exe",
        command="powershell.exe -ExecutionPolicy Bypass -Command & { [EnterpriseDocGen.Tool]::SyncTemplate('finance_q4_budget') }",
        destination="10.20.30.40:443",
        timestamp="2026-09-28 16:05:00",
        user="CORP\\tgreene"
    )

    inv_res = investigation_service.investigate(alert2)

    print(f"Alert ID: {inv_res.alert_id}")
    print(f"Risk Level: {inv_res.risk_level} (Adjusted by Memory!)")
    print(f"Confidence: {inv_res.confidence}")
    print(f"Memory Used: {inv_res.memory_used}")
    print(f"Memories Recalled Count: {inv_res.memory_count}")
    print("\nRecalled Historical Precedents:")
    for m in inv_res.historical_matches[:5]:
        print(f"  • Ref: {m.incident_id} | Similarity: {m.similarity_reason}")
        print(f"    Outcome: {m.historical_outcome}")

    print("\nExecutive Summary:")
    print(inv_res.summary)
    print("\nDefensive Reasoning:")
    for r in inv_res.reasoning:
        print(f"  * {r}")

    print("\n" + "=" * 65)
    print("STEP 3: DIRECT RECALL FOR FEEDBACK IN HINDSIGHT")
    print("=" * 65)
    feedback_memories = hindsight_service.recall(query="analyst feedback doc archiver template sync")
    print(f"Direct recall found {len(feedback_memories)} memories matching feedback query.")
    for i, fm in enumerate(feedback_memories[:3]):
        print(f"  [{i+1}] ID: {fm.get('id')} | Score: {fm.get('score')}")
        print(f"      Text: {fm.get('text')[:120]}...")

    return True

if __name__ == "__main__":
    verify_feedback_loop()
