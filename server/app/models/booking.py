"""Bookings, payments, invoices, refunds, coupons, agreements (Module 5)."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, uuid_pk
from app.models.enums import BookingStatus, PaymentStatus


class Booking(Base, TimestampMixin):
    __tablename__ = "bookings"

    id: Mapped[str] = uuid_pk()
    reference: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    student_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)

    check_in: Mapped[date] = mapped_column(Date, index=True)
    check_out: Mapped[date] = mapped_column(Date, index=True)
    duration_months: Mapped[int] = mapped_column(Integer, default=1)
    guests: Mapped[int] = mapped_column(Integer, default=1)

    status: Mapped[BookingStatus] = mapped_column(
        Enum(BookingStatus), default=BookingStatus.pending, index=True
    )

    # Price breakdown
    rent_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    security_deposit: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    cleaning_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    tax_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    discount_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    currency: Mapped[str] = mapped_column(String(3), default="INR")

    coupon_id: Mapped[str | None] = mapped_column(ForeignKey("coupons.id"))
    idempotency_key: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancellation_reason: Mapped[str | None] = mapped_column(Text)

    student = relationship("User", back_populates="bookings", foreign_keys=[student_id])
    room = relationship("Room")
    payment = relationship(
        "Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )
    invoices = relationship("Invoice", back_populates="booking", cascade="all, delete-orphan")
    refunds = relationship("Refund", back_populates="booking", cascade="all, delete-orphan")
    agreement = relationship(
        "RentalAgreement", back_populates="booking", uselist=False, cascade="all, delete-orphan"
    )


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = uuid_pk()
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), unique=True, index=True)
    provider: Mapped[str] = mapped_column(String(40), default="stripe")
    provider_intent_id: Mapped[str | None] = mapped_column(String(120), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.pending, index=True
    )
    method: Mapped[str | None] = mapped_column(String(40))
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    booking = relationship("Booking", back_populates="payment")


class Invoice(Base, TimestampMixin):
    __tablename__ = "invoices"

    id: Mapped[str] = uuid_pk()
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), index=True)
    number: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    pdf_url: Mapped[str | None] = mapped_column(String(512))
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    booking = relationship("Booking", back_populates="invoices")


class Refund(Base, TimestampMixin):
    __tablename__ = "refunds"

    id: Mapped[str] = uuid_pk()
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))
    reason: Mapped[str | None] = mapped_column(Text)
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus), default=PaymentStatus.pending, index=True
    )
    provider_refund_id: Mapped[str | None] = mapped_column(String(120))
    processed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    booking = relationship("Booking", back_populates="refunds")


class Coupon(Base, TimestampMixin):
    __tablename__ = "coupons"

    id: Mapped[str] = uuid_pk()
    code: Mapped[str] = mapped_column(String(30), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(String(200))
    discount_percent: Mapped[float | None] = mapped_column(Float)
    discount_flat: Mapped[float | None] = mapped_column(Numeric(12, 2))
    max_discount: Mapped[float | None] = mapped_column(Numeric(12, 2))
    min_booking_amount: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    usage_limit: Mapped[int | None] = mapped_column(Integer)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    valid_from: Mapped[date | None] = mapped_column(Date)
    valid_until: Mapped[date | None] = mapped_column(Date)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class CouponRedemption(Base, TimestampMixin):
    __tablename__ = "coupon_redemptions"
    __table_args__ = (UniqueConstraint("coupon_id", "user_id", "booking_id"),)

    id: Mapped[str] = uuid_pk()
    coupon_id: Mapped[str] = mapped_column(ForeignKey("coupons.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), index=True)
    amount: Mapped[float] = mapped_column(Numeric(12, 2))


class RentalAgreement(Base, TimestampMixin):
    __tablename__ = "rental_agreements"

    id: Mapped[str] = uuid_pk()
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), unique=True, index=True)
    document_url: Mapped[str | None] = mapped_column(String(512))
    signed_by_student: Mapped[bool] = mapped_column(Boolean, default=False)
    signed_by_host: Mapped[bool] = mapped_column(Boolean, default=False)
    signed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    booking = relationship("Booking", back_populates="agreement")
