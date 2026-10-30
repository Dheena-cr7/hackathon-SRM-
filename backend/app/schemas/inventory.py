"""
CampusOps — Pydantic Inventory & Procurement Schemas
"""

from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field

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

    class Config:
        from_attributes = True

class PartsReservationRequest(BaseModel):
    work_order_id: str
    item_id: str
    quantity: int = Field(..., gt=0)

class PurchaseRequestCreate(BaseModel):
    item_id: str
    quantity: int = Field(..., gt=0)
    justification: str

class ApprovalDecisionRequest(BaseModel):
    decision: str = Field(..., pattern="^(approved|rejected)$")
    comments: str

class PurchaseRequestResponse(BaseModel):
    id: str
    item_id: str
    requested_by_id: str
    quantity: int
    total_cost: float
    justification: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

