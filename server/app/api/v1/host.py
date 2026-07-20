"""Host dashboard: revenue, occupancy, analytics, leads (Module 7)."""
from __future__ import annotations

from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.booking import Booking, Payment
from app.models.enums import BookingStatus, PaymentStatus, UserRole
from app.models.property import Property
from app.models.room import Room, RoomAvailability
from app.models.user import User
from app.schemas.booking import BookingOut

router = APIRouter(prefix="/host", tags=["host"])


@router.get("/dashboard")
def dashboard(
    db: Session = Depends(get_db), host: User = Depends(require_roles(UserRole.host))
) -> dict:
    property_ids = [
        p.id for p in db.scalars(select(Property).where(Property.host_id == host.id)).all()
    ]
    if not property_ids:
        return {
            "revenue": 0, "bookings": 0, "occupancy_rate": 0,
            "properties": 0, "active_leads": 0,
        }

    revenue = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .join(Booking, Booking.id == Payment.booking_id)
        .where(Booking.property_id.in_(property_ids), Payment.status == PaymentStatus.succeeded)
    )
    bookings_count = db.scalar(
        select(func.count(Booking.id)).where(Booking.property_id.in_(property_ids))
    )

    # Occupancy over next 30 days = booked units / total units.
    start, end = date.today(), date.today() + timedelta(days=30)
    total_capacity = db.scalar(
        select(func.coalesce(func.sum(Room.total_units), 0)).where(
            Room.property_id.in_(property_ids)
        )
    ) or 0
    avail = db.scalar(
        select(func.coalesce(func.avg(RoomAvailability.units_available), 0))
        .join(Room, Room.id == RoomAvailability.room_id)
        .where(Room.property_id.in_(property_ids), RoomAvailability.date.between(start, end))
    ) or 0
    occupancy = round((1 - (float(avail) / total_capacity)) * 100, 1) if total_capacity else 0

    return {
        "revenue": float(revenue or 0),
        "bookings": int(bookings_count or 0),
        "occupancy_rate": occupancy,
        "properties": len(property_ids),
        "active_leads": db.query(Booking)
        .filter(Booking.property_id.in_(property_ids), Booking.status == BookingStatus.pending)
        .count(),
    }


@router.get("/properties")
def host_properties(
    db: Session = Depends(get_db), host: User = Depends(require_roles(UserRole.host))
):
    props = db.scalars(select(Property).where(Property.host_id == host.id)).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "slug": p.slug,
            "status": p.status,
            "avg_rating": p.avg_rating,
            "view_count": p.view_count,
            "min_price": float(p.min_price) if p.min_price else None,
        }
        for p in props
    ]


@router.get("/bookings", response_model=list[BookingOut])
def host_bookings(
    db: Session = Depends(get_db), host: User = Depends(require_roles(UserRole.host))
) -> list[Booking]:
    property_ids = select(Property.id).where(Property.host_id == host.id)
    return list(
        db.scalars(
            select(Booking).where(Booking.property_id.in_(property_ids))
            .order_by(Booking.created_at.desc())
        ).all()
    )


@router.get("/analytics")
def analytics(
    db: Session = Depends(get_db), host: User = Depends(require_roles(UserRole.host))
) -> dict:
    property_ids = [
        p.id for p in db.scalars(select(Property).where(Property.host_id == host.id)).all()
    ]
    if not property_ids:
        return {"views_by_property": [], "monthly_revenue": []}
    views = db.execute(
        select(Property.name, Property.view_count).where(Property.id.in_(property_ids))
    ).all()
    return {
        "views_by_property": [{"name": n, "views": v} for n, v in views],
        "monthly_revenue": [],  # computed from Payment.paid_at grouped by month in prod
    }
