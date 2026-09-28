from pydantic import BaseModel, Field
from typing import Optional, Literal

class FeedbackInput(BaseModel):
    alert_id: str
    investigation_id: Optional[str] = None
    verdict: Literal["CORRECT", "FALSE_POSITIVE", "ESCALATE", "NEEDS_REVIEW"]
    comments: str = Field(..., description="Analyst rationale and feedback e.g. This was an authorized backup process.")
    analyst_name: Optional[str] = "SOC Lead Analyst"
    action_taken: Optional[str] = Field(None, description="Action taken by analyst e.g. Whitelisted command, Isolated host")

class FeedbackResponse(BaseModel):
    success: bool
    feedback_id: str
    alert_id: str
    retained_in_hindsight: bool
    hindsight_operation_id: Optional[str] = None
    message: str
