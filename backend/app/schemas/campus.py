"""
CampusOps — Pydantic Campus Directory Schemas
"""

from typing import List, Optional
from pydantic import BaseModel

class AssetResponse(BaseModel):
    id: str
    asset_tag: str
    name: str
    category: str
    status: str

    class Config:
        from_attributes = True

class RoomResponse(BaseModel):
    id: str
    building_id: str
    room_number: str
    floor_number: int
    room_type: str
    capacity: int
    is_operational: bool
    assets: List[AssetResponse] = []

    class Config:
        from_attributes = True

class BuildingResponse(BaseModel):
    id: str
    name: str
    code: str
    building_type: str
    floors_count: int
    height_meters: float
    operational_status: str
    is_confirmed: bool
    rooms_count: Optional[int] = 0

    class Config:
        from_attributes = True

