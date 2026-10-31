"""
CampusOps — Room Booking & Concurrency Conflict Prevention Service
Guarantees non-overlapping room reservations and prevents double-booking.
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from backend.app.models.booking import Booking
from backend.app.models.campus import Room
from backend.app.models.audit import AuditLog
from backend.app.schemas.booking import BookingCreate
from backend.app.core.events import event_bus

class DoubleBookingConflictError(Exception):
    """Raised when a room reservation overlaps with an existing confirmed booking."""
    pass

class RoomNotOperationalError(Exception):
    """Raised when attempting to book a room that is currently unserviceable."""
    pass

class BookingService:
    @staticmethod
    async def create_booking(db: AsyncSession, booked_by_id: str, data: BookingCreate) -> Booking:
        # 1. Verify Room Exists and is Operational
        room = await db.get(Room, data.room_id)
        if not room:
            clean_search = data.room_id.replace("room-", "").replace("RM-", "").replace("room_", "").upper()
            res = await db.execute(
                select(Room).where(
                    or_(
                        Room.id.ilike(f"%{clean_search}%"),
                        Room.room_number.ilike(f"%{clean_search}%")
                    )
                )
            )
            room = res.scalars().first()
            if not room:
                raise ValueError(f"Room with id '{data.room_id}' not found.")
            data.room_id = room.id
        if not room.is_operational:
            raise RoomNotOperationalError(f"Room '{room.room_number}' is currently out of service due to maintenance or active incidents.")

        # 2. Concurrency Check: Search for Overlapping Confirmed Bookings
        conflict_query = (
            select(Booking)
            .where(
                and_(
                    Booking.room_id == data.room_id,
                    Booking.status == "confirmed",
                    or_(
                        and_(Booking.start_time <= data.start_time, Booking.end_time > data.start_time),
                        and_(Booking.start_time < data.end_time, Booking.end_time >= data.end_time),
                        and_(Booking.start_time >= data.start_time, Booking.end_time <= data.end_time)
                    )
                )
            )
        )
        existing_conflict = (await db.execute(conflict_query)).scalar_one_or_none()
        if existing_conflict:
            raise DoubleBookingConflictError(
                f"Double-booking conflict: Room '{room.room_number}' is already reserved for "
                f"'{existing_conflict.title}' between {existing_conflict.start_time.strftime('%H:%M')} and {existing_conflict.end_time.strftime('%H:%M')}."
            )

        booking = Booking(
            room_id=data.room_id,
            booked_by_id=booked_by_id,
            title=data.title,
            activity_type=data.activity_type,
            start_time=data.start_time,
            end_time=data.end_time,
            attendee_count=data.attendee_count,
            status="confirmed"
        )
        db.add(booking)
        await db.flush()

        audit = AuditLog(
            event_type="BOOKING_CONFIRMED",
            actor_id=booked_by_id,
            entity_type="booking",
            entity_id=booking.id,
            details={"room_id": data.room_id, "title": data.title}
        )
        db.add(audit)
        await db.commit()
        await db.refresh(booking)

        await event_bus.publish("BookingCreated", {
            "booking_id": booking.id,
            "room_id": booking.room_id,
            "title": booking.title
        })
        return booking

    @staticmethod
    async def list_bookings_by_room(db: AsyncSession, room_id: str) -> List[Booking]:
        res = await db.execute(select(Booking).where(Booking.room_id == room_id).order_by(Booking.start_time.asc()))
        return list(res.scalars().all())
