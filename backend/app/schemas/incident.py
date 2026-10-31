"""
CampusOps — Pydantic Incident & NLP Intake Schemas
"""

from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, Field

class NLPAnalyzeRequest(BaseModel):
    text: Optional[str] = None
    raw_text: Optional[str] = None
    description: Optional[str] = None

    @property
    def query_text(self) -> str:
        return (self.raw_text or self.text or self.description or "").strip()

class ExtractedEntities(BaseModel):
    building_code: Optional[str] = None
    building_name: Optional[str] = None
    room_number: Optional[str] = None
    equipment_type: Optional[str] = None
    has_sparks: bool = False
    is_safety_hazard: bool = False
    time_mentions: List[str] = []

class NLPAnalyzeResponse(BaseModel):
    category: str
    building_id: Optional[str] = None
    building_name: Optional[str] = None
    room_id: Optional[str] = None
    room_number: Optional[str] = None
    asset_id: Optional[str] = None
    asset_name: Optional[str] = None
    urgency: str  # low, medium, high, critical
    severity: str = "medium"
    time_constraint: Optional[str] = None
    missing_fields: List[str] = []
    clarification_question: Optional[str] = None
    clarification_questions: List[str] = []
    confidence_score: float = 0.95
    confidence: float = 0.95
    explanation: Optional[str] = ""
    extracted_entities: ExtractedEntities = Field(default_factory=ExtractedEntities)

class IncidentCreate(BaseModel):
    title: str
    description: str
    category: str
    priority: Optional[str] = "medium"
    severity: Optional[str] = "medium"
    building_id: Optional[str] = None
    room_id: Optional[str] = None
    room_number: Optional[str] = None
    asset_id: Optional[str] = None
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    channel: Optional[str] = "web_portal"
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

