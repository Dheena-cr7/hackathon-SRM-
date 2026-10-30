"""
CampusOps — Room Bookings & Disruption Management Endpoints
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.database import get_db
from backend.app.schemas.booking import (
    BookingCreate, BookingResponse, DisruptionImpactResponse
)
from backend.app.domain.bookings.service import (
    BookingService, DoubleBookingConflictError, RoomNotOperationalError
)
from backend.app.domain.bookings.disruption_service import DisruptionService
from backend.app.api.deps import get_current_user, require_roles
from backend.app.models.user import User

router = APIRouter(prefix="/bookings", tags=["Bookings & Scheduling"])

@router.get("", response_model=List[BookingResponse])
async def list_bookings(
    room_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from sqlalchemy import select
    from backend.app.models.booking import Booking
    query = select(Booking).order_by(Booking.start_time.asc())
    if room_id:
        query = query.where(Booking.room_id == room_id)
    res = await db.execute(query)
    return [BookingResponse.model_validate(b) for b in res.scalars().all()]

@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        booking = await BookingService.create_booking(db, current_user.id, data)
        return BookingResponse.model_validate(booking)
    except DoubleBookingConflictError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except RoomNotOperationalError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/disruption-impact/{room_id}", response_model=DisruptionImpactResponse)
async def get_disruption_impact(
    room_id: str,
    current_user: User = Depends(require_roles("facilities_admin", "dept_manager")),
    db: AsyncSession = Depends(get_db)
):
    try:
        return await DisruptionService.analyze_room_disruption(db, room_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{booking_id}/relocate", response_model=BookingResponse)
async def relocate_booking(
    booking_id: str,
    payload: dict,
    current_user: User = Depends(require_roles("facilities_admin", "dept_manager")),
    db: AsyncSession = Depends(get_db)
):
    new_room_id = payload.get("new_room_id")
    if not new_room_id:
        raise HTTPException(status_code=400, detail="new_room_id is required")

    try:
        booking = await DisruptionService.execute_relocation(db, booking_id, new_room_id, current_user.id)
        return BookingResponse.model_validate(booking)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
