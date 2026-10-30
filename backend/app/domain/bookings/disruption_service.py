"""
CampusOps — Classroom Disruption & Relocation Impact Analyzer
Coordinates academic rescheduling when physical infrastructure fails.
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from backend.app.models.booking import Booking
from backend.app.models.campus import Room, Building
from backend.app.models.audit import AuditLog
from backend.app.models.audit import Notification
from backend.app.schemas.booking import DisruptionImpactResponse, RelocationProposal
from backend.app.core.events import event_bus

class DisruptionService:
    @staticmethod
    async def analyze_room_disruption(db: AsyncSession, room_id: str) -> DisruptionImpactResponse:
        disrupted_room = await db.get(Room, room_id)
        if not disrupted_room:
            # Flexible room identifier matching (e.g., 'room-tp-204', 'RM-TP-204', '204', 'B204')
            clean_search = room_id.replace("room-", "").replace("RM-", "").upper()
            res = await db.execute(
                select(Room).where(
                    or_(
                        Room.id.ilike(f"%{clean_search}%"),
                        Room.room_number.ilike(f"%{clean_search}%")
                    )
                )
            )
            disrupted_room = res.scalars().first()
            if not disrupted_room:
                raise ValueError(f"Room '{room_id}' not found.")
            room_id = disrupted_room.id

        # 1. Find all confirmed bookings for this room
        bookings_query = (
            select(Booking)
            .where(
                and_(
                    Booking.room_id == room_id,
                    Booking.status == "confirmed"
                )
            )
            .order_by(Booking.start_time.asc())
        )
        result = await db.execute(bookings_query)
        affected_bookings = list(result.scalars().all())

        # Determine maximum attendee capacity needed
        max_attendees = max([b.attendee_count for b in affected_bookings], default=disrupted_room.capacity)

        # 2. Find eligible alternative rooms
        # Requirements: is_operational=True, capacity >= max_attendees, room_id != disrupted_room_id
        alt_rooms_query = (
            select(Room, Building.name)
            .join(Building, Room.building_id == Building.id)
            .where(
                and_(
                    Room.is_operational == True,
                    Room.capacity >= max_attendees,
                    Room.id != room_id
                )
            )
            .order_by(Room.capacity.asc())
        )
        alt_result = await db.execute(alt_rooms_query)
        candidate_rooms = alt_result.all()

        relocation_proposals: List[RelocationProposal] = []
        for r, b_name in candidate_rooms:
            # Check if this candidate room has conflict during the affected booking slots
            has_conflict = False
            for aff_b in affected_bookings:
                conf_q = (
                    select(Booking)
                    .where(
                        and_(
                            Booking.room_id == r.id,
                            Booking.status == "confirmed",
                            Booking.start_time < aff_b.end_time,
                            Booking.end_time > aff_b.start_time
                        )
                    )
                )
                if (await db.execute(conf_q)).scalar_one_or_none():
                    has_conflict = True
                    break

            if not has_conflict:
                relocation_proposals.append(RelocationProposal(
                    alternative_room_id=r.id,
                    building_name=b_name,
                    room_number=r.room_number,
                    capacity=r.capacity,
                    room_type=r.room_type,
                    match_reason=f"Available during all required time slots; Capacity {r.capacity} fits required {max_attendees} attendees"
                ))

        affected_list = [
            {
                "id": b.id,
                "title": b.title,
                "activity_type": b.activity_type,
                "start_time": b.start_time.isoformat(),
                "end_time": b.end_time.isoformat(),
                "attendee_count": b.attendee_count,
            }
            for b in affected_bookings
        ]

        return DisruptionImpactResponse(
            disrupted_room_id=room_id,
            room_number=disrupted_room.room_number,
            affected_bookings_count=len(affected_bookings),
            affected_bookings=affected_list,
            recommended_relocations=relocation_proposals
        )

    @staticmethod
    async def execute_relocation(db: AsyncSession, booking_id: str, new_room_id: str, authorized_by_id: str) -> Booking:
        booking = await db.get(Booking, booking_id)
        if not booking:
            raise ValueError(f"Booking '{booking_id}' not found.")

        old_room_id = booking.room_id
        old_room = await db.get(Room, old_room_id)
        new_room = await db.get(Room, new_room_id)

        booking.relocated_from_room_id = old_room_id
        booking.room_id = new_room_id
        booking.status = "confirmed"

        # Mark disrupted room out of service
        if old_room:
            old_room.is_operational = False

        audit = AuditLog(
            event_type="BOOKING_RELOCATED",
            actor_id=authorized_by_id,
            entity_type="booking",
            entity_id=booking.id,
            details={
                "title": booking.title,
                "from_room": old_room_id,
                "to_room": new_room_id,
                "attendees": booking.attendee_count
            }
        )
        db.add(audit)

        # Notify instructor / attendees
        notif = Notification(
            recipient_id=booking.booked_by_id,
            title="Classroom Relocation Notice",
            message=f"Due to facilities disruption in Room {old_room.room_number if old_room else old_room_id}, your '{booking.title}' has been moved to {new_room.room_number if new_room else new_room_id}.",
            category="disruption"
        )
        db.add(notif)
        await db.commit()
        await db.refresh(booking)

        await event_bus.publish("BookingRelocated", {
            "booking_id": booking.id,
            "title": booking.title,
            "old_room_id": old_room_id,
            "new_room_id": new_room_id,
            "building_id": new_room.building_id if new_room else None
        })

        return booking

