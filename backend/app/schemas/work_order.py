"""
CampusOps — Pydantic Work Order & Technician Schemas
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class WorkOrderCreate(BaseModel):
    incident_id: str
    assigned_technician_id: Optional[str] = None
    priority: str = "medium"
    estimated_duration_hours: float = 1.0

class WorkOrderTransitionRequest(BaseModel):
    new_status: str
    resolution_notes: Optional[str] = None

class TechnicianCandidate(BaseModel):
    user_id: str
    full_name: str
    email: str
    title: str
    current_workload: int
    matched_skills: List[str]
    is_on_duty: bool
    shift: str
    score: float
    recommendation_reason: str

class WorkOrderResponse(BaseModel):
    id: str
    order_number: str
    incident_id: str
    assigned_technician_id: Optional[str] = None
    status: str
    priority: str
    estimated_duration_hours: float
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
