import sys
import os

# Ensure repo root and backend are in sys.path
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
backend_dir = os.path.join(repo_root, "backend")
for d in [repo_root, backend_dir]:
    if d not in sys.path:
        sys.path.insert(0, d)

from fastapi.testclient import TestClient
try:
    from backend.app.main import app
except ImportError:
    from app.main import app

client = TestClient(app)

print("=== 1. TEST HEALTH ===")
r = client.get("/api/health")
print("Health:", r.status_code, r.json())
assert r.status_code == 200

print("\n=== 2. TEST STEP 1: INVESTIGATE ALERT 1 (ALT-1042) ===")
alert1 = {
    "alert_id": "ALT-1042",
    "host": "FINANCE-PC-17",
    "severity": "HIGH",
    "process": "powershell.exe",
    "parent_process": "winword.exe",
    "command": "powershell.exe -NoP -NonI -W Hidden -enc SQBFAFgA...",
    "destination": "185.220.101.5:443"
}
r1 = client.post("/api/alerts/investigate", json=alert1)
print("Alert 1 Status:", r1.status_code)
res1 = r1.json()
print("Alert 1 Risk Level:", res1.get("risk_level"))
print("Alert 1 Confidence:", res1.get("confidence"))
print("Alert 1 Memory Used:", res1.get("memory_used"))
print("Alert 1 Historical Matches:", len(res1.get("historical_matches", [])))
for m in res1.get("historical_matches", []):
    print("  Match:", m.get("incident_id"), "-", m.get("similarity_reason")[:80])
assert r1.status_code == 200
assert res1.get("risk_level") in ["HIGH", "CRITICAL"]

print("\n=== 3. TEST STEP 2: INVESTIGATE ALERT 2 (ALT-1088) ===")
alert2 = {
    "alert_id": "ALT-1088",
    "host": "BACKUP-SRV-01",
    "severity": "MEDIUM",
    "process": "powershell.exe",
    "parent_process": "winword.exe",
    "command": "powershell.exe -ExecutionPolicy RemoteSigned -File C:\\EnterpriseBackup\\scripts\\doc_archiver.ps1 -Target C:\\Docs",
    "destination": "10.14.20.5:445"
}
r2 = client.post("/api/alerts/investigate", json=alert2)
print("Alert 2 Status:", r2.status_code)
res2 = r2.json()
print("Alert 2 Risk Level:", res2.get("risk_level"))
print("Alert 2 Summary:", res2.get("summary")[:100])
assert r2.status_code == 200

print("\n=== 4. TEST STEP 3: SUBMIT ANALYST FEEDBACK ON ALT-1088 ===")
fb = {
    "alert_id": "ALT-1088",
    "verdict": "FALSE_POSITIVE",
    "comments": "Verified legitimate administrative archiving routine by IT Engineering.",
    "analyst_name": "Lead SOC Analyst",
    "action_taken": "Added to approved enterprise automation exceptions"
}
r3 = client.post("/api/alerts/feedback", json=fb)
print("Feedback Status:", r3.status_code)
res3 = r3.json()
print("Feedback Response:", res3.get("success"), res3.get("message"))
assert r3.status_code == 200
assert res3.get("success") == True

print("\n=== 5. TEST STEP 4: INVESTIGATE ALERT 3 (ALT-1140: CONTEXT RECALL) ===")
alert3 = {
    "alert_id": "ALT-1140",
    "host": "FINANCE-PC-18",
    "severity": "HIGH",
    "process": "powershell.exe",
    "parent_process": "winword.exe",
    "command": "powershell.exe -ExecutionPolicy Bypass -Command & { [EnterpriseDocGen.Tool]::SyncTemplate('finance_q4_budget') }",
    "destination": "10.20.30.40:443"
}
r4 = client.post("/api/alerts/investigate", json=alert3)
print("Alert 3 Status:", r4.status_code)
res4 = r4.json()
print("Alert 3 Risk Level:", res4.get("risk_level"))
print("Alert 3 Confidence:", res4.get("confidence"))
print("Alert 3 Matches:", len(res4.get("historical_matches", [])))
for m in res4.get("historical_matches", []):
    print("  Match:", m.get("incident_id"), "-", m.get("historical_outcome")[:80])
assert r4.status_code == 200

print("\n>>> ALL DEMO STEPS PASSED SUCCESSFULLY! <<<")
