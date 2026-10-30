"""
CampusOps — Pydantic Operational Analytics Schemas
"""

from typing import List, Dict, Optional
from pydantic import BaseModel

class BuildingMetric(BaseModel):
    building_id: str
    building_name: str
    active_incidents: int
    critical_incidents: int
    operational_status: str

class IncidentMetrics(BaseModel):
    total: int = 0
    active: int = 0
    by_status: Dict[str, int] = {}
    by_severity: Dict[str, int] = {}
    sla_breaches: int = 0

class WorkOrderMetrics(BaseModel):
    total: int = 0
    active: int = 0
    by_status: Dict[str, int] = {}

class FacilitiesMetrics(BaseModel):
    total_buildings: int = 0
    total_rooms: int = 0
    active_bookings: int = 0

class InventoryMetrics(BaseModel):
    total_items: int = 0
    low_stock_items: int = 0
    pending_purchases: int = 0

class CampusMetricsResponse(BaseModel):
    total_open_incidents: int
    critical_incidents: int
    active_work_orders: int
    disrupted_rooms_count: int
    low_stock_items_count: int
    sla_compliance_rate_percent: float
    incidents_by_category: Dict[str, int]
    building_status_list: List[BuildingMetric]

    # Nested structures for comprehensive frontend dashboards
    incidents: Optional[IncidentMetrics] = None
    work_orders: Optional[WorkOrderMetrics] = None
    facilities: Optional[FacilitiesMetrics] = None
    inventory: Optional[InventoryMetrics] = None
    sla_compliance_rate: Optional[float] = None


