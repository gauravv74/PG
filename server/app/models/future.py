"""Scaffolded tables for Module 17 future features (behind feature flags)."""
from __future__ import annotations

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, uuid_pk
from app.models.enums import Gender


class RoommateProfile(Base, TimestampMixin):
    __tablename__ = "roommate_profiles"

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    gender_preference: Mapped[Gender] = mapped_column(Enum(Gender), default=Gender.any)
    budget_min: Mapped[float | None] = mapped_column(Numeric(12, 2))
    budget_max: Mapped[float | None] = mapped_column(Numeric(12, 2))
    lifestyle: Mapped[dict] = mapped_column(JSONB, default=dict)  # smoker, pets, sleep schedule...
    bio: Mapped[str | None] = mapped_column(Text)
    looking: Mapped[bool] = mapped_column(Boolean, default=True, index=True)


class SplitRent(Base, TimestampMixin):
    __tablename__ = "split_rents"

    id: Mapped[str] = uuid_pk()
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), index=True)
    payer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    share_amount: Mapped[float] = mapped_column(Numeric(12, 2))
    paid: Mapped[bool] = mapped_column(Boolean, default=False)


class MarketplaceItem(Base, TimestampMixin):
    __tablename__ = "marketplace_items"

    id: Mapped[str] = uuid_pk()
    seller_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Numeric(12, 2))
    category: Mapped[str | None] = mapped_column(String(80), index=True)
    image_url: Mapped[str | None] = mapped_column(String(512))
    sold: Mapped[bool] = mapped_column(Boolean, default=False)


class MaintenanceRequest(Base, TimestampMixin):
    __tablename__ = "maintenance_requests"

    id: Mapped[str] = uuid_pk()
    booking_id: Mapped[str] = mapped_column(ForeignKey("bookings.id"), index=True)
    category: Mapped[str] = mapped_column(String(80))
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30), default="open", index=True)
    priority: Mapped[str] = mapped_column(String(20), default="normal")


class LoyaltyTransaction(Base, TimestampMixin):
    __tablename__ = "loyalty_transactions"

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    points: Mapped[int] = mapped_column(Integer)  # +earn / -redeem
    reason: Mapped[str] = mapped_column(String(160))
