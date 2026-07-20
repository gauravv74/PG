"""Cities & universities (Modules 1, 8, 12)."""
from __future__ import annotations

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, uuid_pk


class City(Base, TimestampMixin):
    __tablename__ = "cities"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True, nullable=False)
    country: Mapped[str] = mapped_column(String(80), index=True, nullable=False)
    state: Mapped[str | None] = mapped_column(String(120))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(512))
    description: Mapped[str | None] = mapped_column(Text)
    is_trending: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    property_count: Mapped[int] = mapped_column(Integer, default=0)

    universities = relationship("University", back_populates="city")
    properties = relationship("Property", back_populates="city")


class University(Base, TimestampMixin):
    __tablename__ = "universities"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True, nullable=False)
    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id"), index=True, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    logo_url: Mapped[str | None] = mapped_column(String(512))
    is_top: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    student_count: Mapped[int | None] = mapped_column(Integer)

    city: Mapped[City] = relationship(back_populates="universities")
