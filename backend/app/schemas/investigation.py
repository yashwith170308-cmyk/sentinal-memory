from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class HistoricalMatch(BaseModel):
    memory_id: str = Field(..., description="ID of recalled Hindsight memory unit")
    incident_id: str = Field(..., description="Referenced incident e.g. INC-0081")
    title: Optional[str] = Field(None, description="Short title of the incident")
    similarity_reason: str = Field(..., description="Why this memory was recalled and how it maps to current alert")
    historical_outcome: str = Field(..., description="Resolution or outcome from past investigation")
    confidence_score: Optional[float] = Field(None, description="Hindsight recall score or confidence")
    tags: Optional[List[str]] = Field(default_factory=list, description="Tags associated with this memory")
    timestamp: Optional[str] = Field(None, description="When the incident occurred")
    text: Optional[str] = Field(None, description="Actual recalled memory text or snippet from Hindsight")

class InvestigationResult(BaseModel):
    alert_id: str
    risk_level: str = Field(..., description="CRITICAL, HIGH, MEDIUM, LOW, or INFORMATIONAL")
    confidence: float = Field(..., description="Confidence score between 0.0 and 1.0")
    summary: str = Field(..., description="Executive investigation summary")
    key_indicators: List[str] = Field(..., description="Observable technical indicators from current alert")
    historical_matches: List[HistoricalMatch] = Field(default_factory=list, description="Memories recalled from Hindsight")
    reasoning: List[str] = Field(..., description="Structured defensive reasoning points")
    recommended_actions: List[str] = Field(..., description="Concrete SOC response recommendations")
    memory_used: bool = Field(False, description="True if Hindsight memory provided contextual evidence")
    memory_count: int = Field(0, description="Total number of memories recalled")
    memory_status: str = Field("CONNECTED", description="CONNECTED, UNAVAILABLE, or NO_RELEVANT_MEMORIES")
    hindsight_reflection: Optional[str] = Field(None, description="Hindsight reflection synthesis if available")
    execution_time_ms: Optional[float] = None
    investigation_id: Optional[str] = None
