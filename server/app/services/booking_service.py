"""Booking pricing, live inventory, and confirmation logic (Module 5)."""
from __future__ import annotations

import secrets
from datetime import UTC, date

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.booking import Booking, Coupon
from app.models.enums import BookingStatus
from app.models.room import Room, RoomAvailability
from app.schemas.booking import BookingCreate, QuoteRequest, QuoteResponse

TAX_RATE = 0.18  # GST example


def _months_between(check_in: date, check_out: date) -> int:
    days = (check_out - check_in).days
    return max(1, round(days / 30))


def _apply_coupon(db: Session, code: str | None, base: float) -> tuple[float, Coupon | None]:
    if not code:
        return 0.0, None
    coupon = db.scalar(select(Coupon).where(Coupon.code == code, Coupon.active.is_(True)))
    if not coupon:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired coupon")
    if base < float(coupon.min_booking_amount or 0):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Booking amount below coupon minimum")
    discount = 0.0
    if coupon.discount_percent:
        discount = base * coupon.discount_percent / 100
    if coupon.discount_flat:
        discount = max(discount, float(coupon.discount_flat))
    if coupon.max_discount:
        discount = min(discount, float(coupon.max_discount))
    return round(discount, 2), coupon


def _available_units(db: Session, room: Room, check_in: date, check_out: date) -> int:
    """Minimum available units across the requested date range (live inventory)."""
    rows = db.scalars(
        select(RoomAvailability).where(
            RoomAvailability.room_id == room.id,
            RoomAvailability.date >= check_in,
            RoomAvailability.date < check_out,
        )
    ).all()
    by_date = {r.date: r for r in rows}
    total_days = (check_out - check_in).days
    min_units = room.total_units
    for i in range(total_days):
        d = date.fromordinal(check_in.toordinal() + i)
        row = by_date.get(d)
        if row is not None:
            if row.is_blocked:
                return 0
            min_units = min(min_units, row.units_available)
    return max(0, min_units)


def build_quote(db: Session, data: QuoteRequest) -> QuoteResponse:
    room = db.get(Room, data.room_id)
    if not room:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")
    if data.check_out <= data.check_in:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "check_out must be after check_in")

    months = _months_between(data.check_in, data.check_out)
    rent = float(room.base_price) * months
    deposit = float(room.security_deposit)
    cleaning = float(room.cleaning_fee)
    discount, _ = _apply_coupon(db, data.coupon_code, rent)
    taxable = max(0.0, rent - discount) + cleaning
    tax = round(taxable * TAX_RATE, 2)
    total = round(rent - discount + deposit + cleaning + tax, 2)
    available = _available_units(db, room, data.check_in, data.check_out) > 0

    return QuoteResponse(
        room_id=room.id,
        duration_months=months,
        rent_amount=round(rent, 2),
        security_deposit=deposit,
        cleaning_fee=cleaning,
        tax_amount=tax,
        discount_amount=discount,
        total_amount=total,
        currency=room.currency,
        available=available,
    )


def create_booking(db: Session, student_id: str, data: BookingCreate) -> Booking:
    # Idempotency: return existing booking for the same key.
    existing = db.scalar(select(Booking).where(Booking.idempotency_key == data.idempotency_key))
    if existing:
        return existing

    room = db.get(Room, data.room_id)
    if not room:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Room not found")

    # Lock inventory rows to prevent double booking.
    locked_rows = db.scalars(
        select(RoomAvailability)
        .where(
            RoomAvailability.room_id == room.id,
            RoomAvailability.date >= data.check_in,
            RoomAvailability.date < data.check_out,
        )
        .with_for_update()
    ).all()
    if _available_units(db, room, data.check_in, data.check_out) < 1:
        raise HTTPException(status.HTTP_409_CONFLICT, "No availability for the selected dates")

    quote = build_quote(
        db,
        QuoteRequest(
            room_id=data.room_id,
            check_in=data.check_in,
            check_out=data.check_out,
            guests=data.guests,
            coupon_code=data.coupon_code,
        ),
    )

    booking = Booking(
        reference="UN" + secrets.token_hex(4).upper(),
        student_id=student_id,
        room_id=room.id,
        property_id=room.property_id,
        check_in=data.check_in,
        check_out=data.check_out,
        duration_months=quote.duration_months,
        guests=data.guests,
        status=BookingStatus.pending,
        rent_amount=quote.rent_amount,
        security_deposit=quote.security_deposit,
        cleaning_fee=quote.cleaning_fee,
        tax_amount=quote.tax_amount,
        discount_amount=quote.discount_amount,
        total_amount=quote.total_amount,
        currency=quote.currency,
        idempotency_key=data.idempotency_key,
    )
    db.add(booking)

    # Decrement inventory for each date in range.
    for row in locked_rows:
        row.units_available = max(0, row.units_available - 1)

    db.commit()
    db.refresh(booking)
    return booking


def cancel_booking(db: Session, booking: Booking, reason: str | None) -> float:
    """Cancel + compute refund per flexible cancellation policy. Returns refund amount."""
    from datetime import datetime

    if booking.status in (BookingStatus.cancelled, BookingStatus.refunded):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Booking already cancelled")

    days_to_checkin = (booking.check_in - date.today()).days
    if days_to_checkin >= 30:
        refund_ratio = 1.0
    elif days_to_checkin >= 7:
        refund_ratio = 0.5
    else:
        refund_ratio = 0.0
    refund_amount = round(
        float(booking.rent_amount) * refund_ratio + float(booking.security_deposit), 2
    )

    booking.status = BookingStatus.cancelled
    booking.cancelled_at = datetime.now(UTC)
    booking.cancellation_reason = reason

    # Release inventory.
    rows = db.scalars(
        select(RoomAvailability).where(
            RoomAvailability.room_id == booking.room_id,
            RoomAvailability.date >= booking.check_in,
            RoomAvailability.date < booking.check_out,
        )
    ).all()
    for row in rows:
        row.units_available += 1
    db.commit()
    return refund_amount
