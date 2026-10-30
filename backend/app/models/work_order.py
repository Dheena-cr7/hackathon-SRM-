"""
CampusOps — Work Orders & State Machine Database Models
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import generate_uuid, utc_now

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    order_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g., 'WO-2026-0001'
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), unique=True, nullable=False)
    assigned_technician_id = Column(String(36), ForeignKey("staff_profiles.user_id"), nullable=True)
    
    # State Machine: pending -> assigned -> in_progress -> awaiting_parts -> pending_verification -> completed
    status = Column(String(30), default="pending", nullable=False)
    priority = Column(String(20), default="medium", nullable=False)
    estimated_duration_hours = Column(Float, default=1.0, nullable=False)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    incident = relationship("Incident", back_populates="work_order")
    assigned_technician = relationship("StaffProfile", back_populates="work_orders")
    parts_reservations = relationship("PartsReservation", back_populates="work_order", cascade="all, delete-orphan")

