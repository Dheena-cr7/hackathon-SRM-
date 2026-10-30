"""
CampusOps — Inventory, Parts Reservation & Procurement Models
Enforces non-negative stock and anti-self-approval rules.
"""

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base
from backend.app.models.base import generate_uuid, utc_now

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    sku = Column(String(100), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # electrical, hvac, plumbing, av, hardware
    quantity_on_hand = Column(Integer, default=0, nullable=False)
    quantity_reserved = Column(Integer, default=0, nullable=False)
    reorder_threshold = Column(Integer, default=5, nullable=False)
    unit_cost = Column(Float, default=0.0, nullable=False)

    __table_args__ = (
        CheckConstraint("quantity_on_hand >= 0", name="chk_stock_non_negative"),
        CheckConstraint("quantity_reserved >= 0", name="chk_reserved_non_negative"),
    )

    reservations = relationship("PartsReservation", back_populates="item")
    purchase_requests = relationship("PurchaseRequest", back_populates="item")

class PartsReservation(Base):
    __tablename__ = "parts_reservations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    work_order_id = Column(String(36), ForeignKey("work_orders.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(String(36), ForeignKey("inventory_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    status = Column(String(30), default="reserved", nullable=False)  # reserved, consumed, released
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_reservation_positive"),
    )

    work_order = relationship("WorkOrder", back_populates="parts_reservations")
    item = relationship("InventoryItem", back_populates="reservations")

class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    item_id = Column(String(36), ForeignKey("inventory_items.id"), nullable=False)
    requested_by_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    total_cost = Column(Float, default=0.0, nullable=False)
    justification = Column(Text, nullable=False)
    status = Column(String(30), default="pending", nullable=False)  # pending, approved, rejected, ordered, fulfilled
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        CheckConstraint("quantity > 0", name="chk_purchase_qty_positive"),
    )

    item = relationship("InventoryItem", back_populates="purchase_requests")
    requested_by = relationship("User", foreign_keys=[requested_by_id])
    approval = relationship("Approval", back_populates="purchase_request", uselist=False)

class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    purchase_request_id = Column(String(36), ForeignKey("purchase_requests.id", ondelete="CASCADE"), unique=True, nullable=False)
    approver_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    decision = Column(String(20), nullable=False)  # approved, rejected
    comments = Column(Text, nullable=False)
    decided_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    purchase_request = relationship("PurchaseRequest", back_populates="approval")
    approver = relationship("User", foreign_keys=[approver_id])

