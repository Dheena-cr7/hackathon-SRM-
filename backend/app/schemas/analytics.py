"""
CampusOps — Pydantic Operational Analytics Schemas
"""

from typing import List, Dict
from pydantic import BaseModel

class BuildingMetric(BaseModel):
    building_id: str
    building_name: str
    active_incidents: int
    critical_incidents: int
    operational_status: str

class CampusMetricsResponse(BaseModel):
    total_open_incidents: int
    critical_incidents: int
    active_work_orders: int
    disrupted_rooms_count: int
    low_stock_items_count: int
    sla_compliance_rate_percent: float
    incidents_by_category: Dict[str, int]
    building_status_list: List[BuildingMetric]
