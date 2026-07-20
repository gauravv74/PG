"""Booking, quote, review, messaging schemas (Modules 5, 9, 10)."""
from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import BookingStatus
from app.schemas.common import ORMModel


class QuoteRequest(BaseModel):
    room_id: str
    check_in: date
    check_out: date
    guests: int = 1
    coupon_code: str | None = None


class QuoteResponse(BaseModel):
    room_id: str
    duration_months: int
    rent_amount: float
    security_deposit: float
    cleaning_fee: float
    tax_amount: float
    discount_amount: float
    total_amount: float
    currency: str
    available: bool


class BookingCreate(BaseModel):
    room_id: str
    check_in: date
    check_out: date
    guests: int = 1
    coupon_code: str | None = None
    idempotency_key: str = Field(min_length=8, max_length=64)


class BookingOut(ORMModel):
    id: str
    reference: str
    property_id: str
    room_id: str
    check_in: date
    check_out: date
    duration_months: int
    status: BookingStatus
    rent_amount: float
    security_deposit: float
    total_amount: float
    currency: str
    created_at: datetime


class ReviewCreate(BaseModel):
    property_id: str
    booking_id: str | None = None
    rating: float = Field(ge=1, le=5)
    cleanliness: float | None = Field(default=None, ge=1, le=5)
    location_rating: float | None = Field(default=None, ge=1, le=5)
    value_rating: float | None = Field(default=None, ge=1, le=5)
    facilities_rating: float | None = Field(default=None, ge=1, le=5)
    title: str | None = None
    comment: str = Field(min_length=10)
    photo_urls: list[str] = []


class ReviewOut(ORMModel):
    id: str
    property_id: str
    author_id: str
    rating: float
    title: str | None = None
    comment: str
    is_verified: bool
    helpful_count: int
    created_at: datetime


class MessageCreate(BaseModel):
    conversation_id: str | None = None
    property_id: str | None = None
    recipient_id: str | None = None
    body: str | None = None
    attachment_url: str | None = None
    attachment_type: str | None = None


class MessageOut(ORMModel):
    id: str
    conversation_id: str
    sender_id: str
    body: str | None = None
    attachment_url: str | None = None
    attachment_type: str | None = None
    is_read: bool
    created_at: datetime
