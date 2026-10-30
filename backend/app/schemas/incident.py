"""
CampusOps — Pydantic Incident & NLP Intake Schemas
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class NLPAnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=3)

class NLPAnalyzeResponse(BaseModel):
    category: str
    building_id: Optional[str] = None
    building_name: Optional[str] = None
    room_id: Optional[str] = None
    room_number: Optional[str] = None
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    urgency: str  # low, medium, high, critical
    time_constraint: Optional[str] = None
    missing_fields: List[str] = []
    clarification_question: Optional[str] = None
    confidence_score: float = 1.0

class IncidentCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: str = "medium"
    building_id: str
    room_id: Optional[str] = None
    asset_id: Optional[str] = None
    raw_text: Optional[str] = None
    extraction_metadata: Dict[str, Any] = {}

class IncidentResponse(BaseModel):
    id: str
    incident_number: str
    reporter_id: str
    title: str
    description: str
    category: str
    priority: str
    status: str
    building_id: str
    room_id: Optional[str] = None
    asset_id: Optional[str] = None
    raw_text: Optional[str] = None
    extraction_metadata: Dict[str, Any] = {}
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
