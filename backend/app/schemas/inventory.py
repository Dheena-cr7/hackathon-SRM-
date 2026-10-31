"""
CampusOps — Pydantic Inventory & Procurement Schemas
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

class InventoryItemCreate(BaseModel):
    sku: Optional[str] = None
    name: str
    category: str = "electrical"  # electrical, hvac, plumbing, it_av, safety, general
    quantity_on_hand: int = Field(default=10, ge=0)
    quantity_reserved: int = Field(default=0, ge=0)
    reorder_threshold: int = Field(default=5, ge=0)
    unit_cost: float = Field(default=25.0, ge=0.0)
    location: Optional[str] = "Central Depot"

class InventoryItemResponse(BaseModel):
    id: str
    sku: str
    name: str
    category: str
    quantity_on_hand: int
    quantity_reserved: int
    available_stock: int
    reorder_threshold: int
    unit_cost: float
    location: Optional[str] = "Central Depot"

    class Config:
        from_attributes = True

class PartsReservationRequest(BaseModel):
    work_order_id: Optional[str] = None
    item_id: str
    quantity: int = Field(..., gt=0)
    reserved_by: Optional[str] = None

class PurchaseRequestCreate(BaseModel):
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    quantity: int = Field(..., gt=0)
    estimated_unit_cost: Optional[float] = None
    vendor: Optional[str] = None
    justification: str
    requester_id: Optional[str] = None

class ApprovalDecisionRequest(BaseModel):
    approver_id: Optional[str] = None
    decision: str = Field(..., pattern="^(approved|rejected)$")
    comments: Optional[str] = ""

class PurchaseRequestResponse(BaseModel):
    id: str
    pr_number: Optional[str] = None
    item_id: Optional[str] = None
    item_name: Optional[str] = None
    requested_by_id: str
    requester_name: Optional[str] = None
    quantity: int
    total_cost: float
    estimated_unit_cost: Optional[float] = None
    vendor: Optional[str] = "Schneider / Siemens Direct"
    justification: str
    status: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
