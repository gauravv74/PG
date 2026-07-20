"""Rooms, live inventory availability, and pricing (Modules 4, 5)."""
from __future__ import annotations

from datetime import date

from sqlalchemy import (
    Boolean,
    Date,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, uuid_pk
from app.models.enums import Gender, RoomType


class Room(Base, TimestampMixin):
    __tablename__ = "rooms"

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    room_type: Mapped[RoomType] = mapped_column(Enum(RoomType), index=True)
    description: Mapped[str | None] = mapped_column(Text)

    base_price: Mapped[float] = mapped_column(Numeric(12, 2), index=True, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    security_deposit: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    cleaning_fee: Mapped[float] = mapped_column(Numeric(12, 2), default=0)

    max_occupancy: Mapped[int] = mapped_column(Integer, default=1)
    total_units: Mapped[int] = mapped_column(Integer, default=1)  # live inventory
    size_sqft: Mapped[int | None] = mapped_column(Integer)
    gender_policy: Mapped[Gender] = mapped_column(Enum(Gender), default=Gender.any, index=True)

    has_private_bathroom: Mapped[bool] = mapped_column(Boolean, default=False)
    has_kitchen: Mapped[bool] = mapped_column(Boolean, default=False)
    has_ac: Mapped[bool] = mapped_column(Boolean, default=False)
    floor_plan_url: Mapped[str | None] = mapped_column(String(512))

    property = relationship("Property", back_populates="rooms")
    availability = relationship(
        "RoomAvailability", back_populates="room", cascade="all, delete-orphan"
    )
    pricing = relationship("RoomPricing", back_populates="room", cascade="all, delete-orphan")


class RoomAvailability(Base):
    """Per-date live inventory for real-time availability (Module 5)."""

    __tablename__ = "room_availability"
    __table_args__ = (UniqueConstraint("room_id", "date"),)

    id: Mapped[str] = uuid_pk()
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    date: Mapped[date] = mapped_column(Date, index=True)
    units_available: Mapped[int] = mapped_column(Integer, default=0)
    price_override: Mapped[float | None] = mapped_column(Numeric(12, 2))
    is_blocked: Mapped[bool] = mapped_column(Boolean, default=False)

    room = relationship("Room", back_populates="availability")


class RoomPricing(Base):
    """Duration-based pricing tiers (weekly/monthly/semester)."""

    __tablename__ = "room_pricing"

    id: Mapped[str] = uuid_pk()
    room_id: Mapped[str] = mapped_column(ForeignKey("rooms.id"), index=True)
    min_duration_months: Mapped[int] = mapped_column(Integer, default=1)
    price_per_month: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    label: Mapped[str | None] = mapped_column(String(80))

    room = relationship("Room", back_populates="pricing")
