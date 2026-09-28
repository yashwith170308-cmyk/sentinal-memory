import sys
import os
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.api.routes.alerts import PREBUILT_DEMO_ALERTS
from backend.app.services.investigation_service import investigation_service

def test_live_investigation():
    demo = PREBUILT_DEMO_ALERTS[0] # ALT-1042
    print(f"Investigating Alert: {demo.alert.alert_id} ({demo.alert.host})")
    print(f"Process: {demo.alert.parent_process} -> {demo.alert.process}")
    
    result = investigation_service.investigate(demo.alert)
    
    print("\n--- INVESTIGATION RESULTS ---")
    print("Alert ID:", result.alert_id)
    print("Risk Level:", result.risk_level)
    print("Confidence:", result.confidence)
    print("Memory Status:", result.memory_status)
    print("Memory Used:", result.memory_used)
    print(f"Memory Count Recalled from Hindsight: {result.memory_count}")
    print("\nRecalled Historical Matches:")
    for m in result.historical_matches:
        print(f"  • Incident Ref: {m.incident_id}")
        print(f"    Reason: {m.similarity_reason}")
        print(f"    Historical Resolution: {m.historical_outcome}")
    print("\nExecutive Summary:")
    print(result.summary)
    print("\nDefensive Reasoning Points:")
    for r in result.reasoning:
        print(f"  * {r}")
    print("\nRecommended Defensive Playbook:")
    for a in result.recommended_actions:
        print(f"  [ ] {a}")

if __name__ == "__main__":
    test_live_investigation()
