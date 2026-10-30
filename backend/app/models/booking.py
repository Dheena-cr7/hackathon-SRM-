"""
CampusOps — Room Bookings & Academic Activities Database Models
Enforces non-overlapping reservations and tracks disruption relocations.
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import generate_uuid, utc_now

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    room_id = Column(String(50), ForeignKey("rooms.id"), nullable=False)
    booked_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    activity_type = Column(String(50), default="lecture", nullable=False)  # lecture, exam, seminar, meeting, lab_session
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    attendee_count = Column(Integer, default=30, nullable=False)
    
    # Status: confirmed, relocated, cancelled
    status = Column(String(30), default="confirmed", nullable=False)
    relocated_from_room_id = Column(String(50), ForeignKey("rooms.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("ix_bookings_room_time", "room_id", "start_time", "end_time"),
    )

    room = relationship("Room", foreign_keys=[room_id], back_populates="bookings")
    relocated_from = relationship("Room", foreign_keys=[relocated_from_room_id])
    booked_by = relationship("User", back_populates="bookings")

