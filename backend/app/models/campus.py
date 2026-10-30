"""
CampusOps — Campus Directory, Buildings, Rooms & Assets Database Models
Matches GeoJSON footprints and coordinates.
"""

from sqlalchemy import Column, String, Integer, Float, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import generate_uuid

class Building(Base):
    __tablename__ = "buildings"

    id = Column(String(50), primary_key=True)  # e.g., 'BLD-TECH-01' matching data/campus.geojson
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    building_type = Column(String(50), nullable=False)  # academic, administrative, laboratory, library, residential, auditorium
    floors_count = Column(Integer, default=1, nullable=False)
    height_meters = Column(Float, default=15.0, nullable=False)
    operational_status = Column(String(50), default="normal", nullable=False)  # normal, maintenance, active_incident, critical_disruption
    is_confirmed = Column(Boolean, default=True, nullable=False)

    rooms = relationship("Room", back_populates="building", cascade="all, delete-orphan")
    incidents = relationship("Incident", back_populates="building")

class Room(Base):
    __tablename__ = "rooms"

    id = Column(String(50), primary_key=True)  # e.g., 'RM-TP-204'
    building_id = Column(String(50), ForeignKey("buildings.id", ondelete="CASCADE"), nullable=False)
    room_number = Column(String(50), nullable=False)
    floor_number = Column(Integer, default=1, nullable=False)
    room_type = Column(String(50), nullable=False)  # lecture_hall, lab, seminar, auditorium, office
    capacity = Column(Integer, default=30, nullable=False)
    is_operational = Column(Boolean, default=True, nullable=False)

    __table_args__ = (
        UniqueConstraint("building_id", "room_number", name="uq_building_room_number"),
    )

    building = relationship("Building", back_populates="rooms")
    assets = relationship("Asset", back_populates="room")
    bookings = relationship("Booking", back_populates="room", foreign_keys="Booking.room_id")
    incidents = relationship("Incident", back_populates="room")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(50), primary_key=True, default=generate_uuid)
    room_id = Column(String(50), ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    asset_tag = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # projector, hvac, electrical, furniture, network, lab_equipment
    status = Column(String(50), default="operational", nullable=False)  # operational, degraded, broken, retired

    room = relationship("Room", back_populates="assets")
    incidents = relationship("Incident", back_populates="asset")

