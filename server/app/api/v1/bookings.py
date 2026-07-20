"""Booking endpoints (Module 5)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.booking import Booking, Payment
from app.models.enums import BookingStatus, PaymentStatus
from app.models.user import User
from app.schemas.booking import BookingCreate, BookingOut, QuoteRequest, QuoteResponse
from app.schemas.common import Message
from app.services import booking_service

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post("/quote", response_model=QuoteResponse)
def quote(data: QuoteRequest, db: Session = Depends(get_db)) -> QuoteResponse:
    return booking_service.build_quote(db, data)


@router.post("", response_model=BookingOut, status_code=201)
def create_booking(
    data: BookingCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Booking:
    booking = booking_service.create_booking(db, user.id, data)
    # Create a pending payment intent record (gateway integration in payment_service).
    db.add(Payment(booking_id=booking.id, amount=booking.total_amount, currency=booking.currency))
    db.commit()
    return booking


@router.post("/{booking_id}/confirm-payment", response_model=BookingOut)
def confirm_payment(
    booking_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Booking:
    """Called by payment webhook or client after successful charge."""
    booking = db.get(Booking, booking_id)
    if not booking or booking.student_id != user.id:
        raise HTTPException(404, "Booking not found")
    booking.status = BookingStatus.confirmed
    if booking.payment:
        booking.payment.status = PaymentStatus.succeeded
    db.commit()
    db.refresh(booking)
    # Enqueue async confirmation + invoice.
    try:
        from app.workers.tasks import generate_invoice, send_booking_confirmation

        send_booking_confirmation.delay(booking.id)
        generate_invoice.delay(booking.id)
    except Exception:  # noqa: BLE001 - broker may be down in dev
        pass
    return booking


@router.get("", response_model=list[BookingOut])
def my_bookings(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Booking]:
    return list(
        db.scalars(
            select(Booking).where(Booking.student_id == user.id).order_by(Booking.created_at.desc())
        ).all()
    )


@router.post("/{booking_id}/cancel", response_model=Message)
def cancel(
    booking_id: str,
    reason: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Message:
    booking = db.get(Booking, booking_id)
    if not booking or booking.student_id != user.id:
        raise HTTPException(404, "Booking not found")
    refund = booking_service.cancel_booking(db, booking, reason)
    return Message(detail=f"Cancelled. Refund of {booking.currency} {refund} is being processed.")
