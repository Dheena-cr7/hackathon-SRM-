"""
CampusOps — Pydantic Booking & Disruption Schemas
"""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

class BookingCreate(BaseModel):
    room_id: str
    title: str
    activity_type: str = "lecture"
    start_time: datetime
    end_time: datetime
    attendee_count: int = 30

class RelocationProposal(BaseModel):
    alternative_room_id: str
    building_name: str
    room_number: str
    capacity: int
    room_type: str
    match_reason: str

class DisruptionImpactResponse(BaseModel):
    disrupted_room_id: str
    room_number: str
    affected_bookings_count: int
    affected_bookings: List[dict]
    recommended_relocations: List[RelocationProposal]

class BookingResponse(BaseModel):
    id: str
    room_id: str
    booked_by_id: str
    title: str
    activity_type: str
    start_time: datetime
    end_time: datetime
    attendee_count: int
    status: str
    relocated_from_room_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

