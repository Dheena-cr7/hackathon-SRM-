"""
CampusOps — Incident Lifecycle & Correlation Database Models
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import generate_uuid, utc_now

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g., 'INC-2026-0001'
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=False)  # electrical, hvac, plumbing, it_av, structural, safety
    priority = Column(String(20), default="medium", nullable=False)  # low, medium, high, critical
    status = Column(String(30), default="reported", nullable=False)  # reported, triage, assigned, in_progress, resolved, closed, cancelled
    
    building_id = Column(String(50), ForeignKey("buildings.id"), nullable=False)
    room_id = Column(String(50), ForeignKey("rooms.id"), nullable=True)
    asset_id = Column(String(50), ForeignKey("assets.id"), nullable=True)

    raw_text = Column(Text, nullable=True)
    extraction_metadata = Column(JSON, default=dict, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    reporter = relationship("User", back_populates="reported_incidents", foreign_keys=[reporter_id])
    building = relationship("Building", back_populates="incidents")
    room = relationship("Room", back_populates="incidents")
    asset = relationship("Asset", back_populates="incidents")
    work_order = relationship("WorkOrder", back_populates="incident", uselist=False)
    correlations = relationship("IncidentCorrelation", back_populates="incident", foreign_keys="IncidentCorrelation.incident_id")

class IncidentCorrelation(Base):
    __tablename__ = "incident_correlations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    correlated_incident_id = Column(String(36), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    correlation_score = Column(Float, default=0.0, nullable=False)
    reason = Column(String(255), nullable=False)  # e.g. "Shared location & electrical category within 30 min window"
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    incident = relationship("Incident", foreign_keys=[incident_id], back_populates="correlations")
