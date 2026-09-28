from fastapi import APIRouter
from typing import Dict, Any, List
from backend.app.services.hindsight_service import hindsight_service
from backend.scripts.seed_memory import seed_hindsight_memory
from backend.app.models.database import SessionLocal, FeedbackRecord, AlertRecord, InvestigationRecord

router = APIRouter(prefix="/demo", tags=["Demo"])

@router.post("/seed")
def trigger_seed():
    """Triggers seeding of synthetic cybersecurity memories into Hindsight."""
    try:
        seed_hindsight_memory()
        return {"success": True, "message": "Memory bank seeded successfully with 9 synthetic incidents."}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.post("/reset")
def reset_demo_state():
    """Resets user-submitted feedbacks and live demo investigations."""
    try:
        with SessionLocal() as db:
            db.query(FeedbackRecord).delete()
            # Retain synthetic seeds, only delete dynamic alerts
            db.query(InvestigationRecord).delete()
            db.commit()
        return {"success": True, "message": "Demo state reset to baseline."}
    except Exception as e:
        return {"success": False, "error": str(e)}

@router.get("/comparison")
def get_memory_comparison():
    """
    Returns the Before/After comparison demonstrating Sentinel's value with Hindsight memory.
    Directly addresses judging criteria & MVP section 13.
    """
    return {
        "alert": {
            "id": "ALT-1088",
            "title": "Scheduled Document Archiver (winword.exe -> powershell.exe)",
            "host": "BACKUP-SRV-01",
            "command": "powershell.exe -ExecutionPolicy RemoteSigned -File C:\\EnterpriseBackup\\scripts\\doc_archiver.ps1"
        },
        "without_memory": {
            "risk_level": "HIGH",
            "confidence": 0.65,
            "status": "GENERIC / BASELINE",
            "summary": "Suspicious execution of PowerShell spawned by Microsoft Word. Potential macro-based code execution.",
            "reasoning": [
                "Process hierarchy matches classic MITRE ATT&CK T1204 / T1059 malicious document execution chains.",
                "Automated heuristic flags all Word-to-PowerShell spawns as potential initial access compromise.",
                "No organizational context or approved automation repository is accessible."
            ],
            "recommended_actions": [
                "Immediately quarantine host BACKUP-SRV-01 from the network.",
                "Isolate endpoint and revoke active domain user credentials.",
                "Escalate to Incident Response Tier-3 team for urgent forensic imaging."
            ],
            "consequences": "Severe false positive impact: Mission-critical enterprise backup server quarantined unnecessarily. Business disruption."
        },
        "with_hindsight_memory": {
            "risk_level": "LOW",
            "confidence": 0.94,
            "status": "HINDSIGHT CONTEXT-AWARE",
            "historical_context": "Recalled INC-0052 and prior SOC Lead Analyst verified exception notes.",
            "summary": "Alert matches known approved enterprise backup routine doc_archiver.ps1 on BACKUP-SRV-01. Hindsight recalled prior analyst determination.",
            "reasoning": [
                "Hindsight memory recalled INC-0052: previous identical execution pattern was verified by Lead Analyst as legitimate IT archiving routine.",
                "Service account CORP_SVC_BACKUP matches previously approved enterprise automation identity.",
                "Risk safely downgraded from HIGH to LOW with 94% confidence, eliminating analyst alert fatigue."
            ],
            "recommended_actions": [
                "Verify script execution against the scheduled change-window management database.",
                "Check user context against IT Systems Engineering roster.",
                "Mark alert as confirmed false positive without quarantining the server."
            ],
            "consequences": "Zero downtime: Prevents false quarantine, saves analyst hours, continuously reinforces organizational memory."
        }
    }

@router.get("/scenarios")
def get_demo_scenarios():
    """
    Returns structured steps for the 60-Second Hackathon Judge Demo.
    """
    return {
        "title": "Sentinel Memory: 60-Second Hackathon Demo",
        "description": "Demonstrates how Sentinel transforms from generic analysis to institutional context.",
        "steps": [
            {
                "step": 1,
                "title": "Baseline Alert (Without Memory)",
                "action": "Investigate ALT-1042 (Phishing Macro)",
                "description": "Sentinel identifies the high-risk attack and correlates it with known malicious patterns."
            },
            {
                "step": 2,
                "title": "The False Positive Dilemma",
                "action": "Investigate ALT-1088 (Backup Archiver)",
                "description": "Standard SOC tools trigger false alarms on Word->PowerShell. Sentinel recalls INC-0052 to prevent alert fatigue."
            },
            {
                "step": 3,
                "title": "Analyst Teaches the Agent",
                "action": "Submit Feedback on ALT-1088",
                "description": "Analyst confirms benign backup exception. Sentinel retains this feedback into Hindsight bank using client.retain()."
            },
            {
                "step": 4,
                "title": "Contextual Evolution",
                "action": "Investigate ALT-1140 (Finance Template Sync)",
                "description": "Sentinel immediately recalls the retained analyst feedback and adapts its recommendation in real-time."
            }
        ]
    }
