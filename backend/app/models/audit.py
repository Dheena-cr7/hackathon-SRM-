"""
CampusOps — Audit Logs, SLA Policies & Notifications Models
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Boolean, JSON, Text
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import generate_uuid, utc_now

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(100), index=True, nullable=False)
    actor_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    entity_type = Column(String(50), index=True, nullable=False)
    entity_id = Column(String(36), index=True, nullable=False)
    details = Column(JSON, default=dict, nullable=False)
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    actor = relationship("User", foreign_keys=[actor_id])

class SLAPolicy(Base):
    __tablename__ = "sla_policies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    priority = Column(String(20), unique=True, index=True, nullable=False)  # low, medium, high, critical
    response_deadline_minutes = Column(Integer, nullable=False)
    resolution_deadline_minutes = Column(Integer, nullable=False)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String(50), default="system", nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True, nullable=False)

    recipient = relationship("User", foreign_keys=[recipient_id])

