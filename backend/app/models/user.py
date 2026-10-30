"""
CampusOps — Identity, Staff & Skills Database Models
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Table
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import generate_uuid, utc_now

staff_skills = Table(
    "staff_skills",
    Base.metadata,
    Column("staff_id", String(36), ForeignKey("staff_profiles.user_id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", String(36), ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False)  # student, faculty, technician, dept_manager, facilities_admin, procurement_approver, system_admin
    department = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    staff_profile = relationship("StaffProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    reported_incidents = relationship("Incident", back_populates="reporter", foreign_keys="Incident.reporter_id")
    bookings = relationship("Booking", back_populates="booked_by")

class StaffProfile(Base):
    __tablename__ = "staff_profiles"

    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    title = Column(String(100), nullable=False)
    shift_start = Column(String(10), default="08:00", nullable=False)
    shift_end = Column(String(10), default="17:00", nullable=False)
    is_on_duty = Column(Boolean, default=True, nullable=False)
    current_workload = Column(Integer, default=0, nullable=False)

    user = relationship("User", back_populates="staff_profile")
    skills = relationship("Skill", secondary=staff_skills, back_populates="staff_members")
    work_orders = relationship("WorkOrder", back_populates="assigned_technician")

class Skill(Base):
    __tablename__ = "skills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # electrical, hvac, plumbing, it_av, structural, general

    staff_members = relationship("StaffProfile", secondary=staff_skills, back_populates="skills")
