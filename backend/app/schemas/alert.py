from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class AlertInput(BaseModel):
    alert_id: str = Field(..., description="Unique alert identifier e.g. ALT-1042")
    host: str = Field(..., description="Host or endpoint name e.g. FINANCE-PC-17")
    severity: str = Field("HIGH", description="Severity level: CRITICAL, HIGH, MEDIUM, LOW")
    process: str = Field(..., description="Process name e.g. powershell.exe")
    parent_process: str = Field(..., description="Parent process name e.g. winword.exe")
    command: str = Field(..., description="Executed command line")
    destination: Optional[str] = Field(None, description="Network destination IP/Port")
    timestamp: Optional[str] = Field(None, description="Alert occurrence timestamp")
    user: Optional[str] = Field(None, description="Username or security context")
    raw_log: Optional[str] = Field(None, description="Raw security alert log/payload")

class DemoAlert(BaseModel):
    id: str
    name: str
    description: str
    alert: AlertInput
    category: str
    expected_behavior: str
