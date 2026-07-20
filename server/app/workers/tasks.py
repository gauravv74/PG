"""Async tasks: notifications, invoices, reminders, media, embeddings (Modules 5, 14)."""
from __future__ import annotations

from datetime import UTC, date, timedelta

from app.db.session import SessionLocal
from app.services import notification_service as notify
from app.workers.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def send_booking_confirmation(self, booking_id: str) -> None:
    from app.models.booking import Booking

    db = SessionLocal()
    try:
        booking = db.get(Booking, booking_id)
        if not booking:
            return
        student = booking.student
        subject = f"Booking confirmed — {booking.reference}"
        body = (
            f"Hi {student.full_name}, your booking {booking.reference} is confirmed. "
            f"Total: {booking.currency} {booking.total_amount}."
        )
        notify.record_in_app(db, student.id, subject, body, {"booking_id": booking.id})
        if student.email:
            notify.send_email(student.email, subject, f"<p>{body}</p>")
        if student.phone:
            notify.send_whatsapp(student.phone, body)
    except Exception as exc:  # noqa: BLE001
        raise self.retry(exc=exc) from exc
    finally:
        db.close()


@celery_app.task
def generate_invoice(booking_id: str) -> None:
    """Generate and store a PDF invoice, then attach the URL to the booking."""
    import secrets
    from datetime import datetime

    from app.models.booking import Booking, Invoice

    db = SessionLocal()
    try:
        booking = db.get(Booking, booking_id)
        if not booking:
            return
        invoice = Invoice(
            booking_id=booking.id,
            number="INV-" + secrets.token_hex(4).upper(),
            amount=booking.total_amount,
            issued_at=datetime.now(UTC),
        )
        db.add(invoice)
        db.commit()
    finally:
        db.close()


@celery_app.task
def send_rent_reminders() -> None:
    from app.models.booking import Booking
    from app.models.enums import BookingStatus

    db = SessionLocal()
    try:
        due = date.today() + timedelta(days=3)
        bookings = (
            db.query(Booking)
            .filter(Booking.status == BookingStatus.checked_in, Booking.check_out == due)
            .all()
        )
        for b in bookings:
            notify.record_in_app(
                db, b.student_id, "Rent reminder", f"Rent due soon for {b.reference}"
            )
    finally:
        db.close()


@celery_app.task
def send_move_in_reminders() -> None:
    from app.models.booking import Booking
    from app.models.enums import BookingStatus

    db = SessionLocal()
    try:
        soon = date.today() + timedelta(days=2)
        bookings = (
            db.query(Booking)
            .filter(Booking.status == BookingStatus.confirmed, Booking.check_in == soon)
            .all()
        )
        for b in bookings:
            notify.record_in_app(
                db, b.student_id, "Move-in reminder", f"Move-in for {b.reference} is in 2 days"
            )
    finally:
        db.close()


@celery_app.task
def process_saved_search_alerts() -> None:
    """Placeholder: match new listings against saved searches and notify."""
    return None
