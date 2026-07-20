"""Reviews, ratings, photos, replies (Module 10)."""
from __future__ import annotations

from sqlalchemy import Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, uuid_pk


class Review(Base, TimestampMixin):
    __tablename__ = "reviews"

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    author_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    booking_id: Mapped[str | None] = mapped_column(ForeignKey("bookings.id"))

    rating: Mapped[float] = mapped_column(Float, index=True)
    cleanliness: Mapped[float | None] = mapped_column(Float)
    location_rating: Mapped[float | None] = mapped_column(Float)
    value_rating: Mapped[float | None] = mapped_column(Float)
    facilities_rating: Mapped[float | None] = mapped_column(Float)

    title: Mapped[str | None] = mapped_column(String(200))
    comment: Mapped[str] = mapped_column(Text)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    helpful_count: Mapped[int] = mapped_column(Integer, default=0)

    property = relationship("Property", back_populates="reviews")
    photos = relationship("ReviewPhoto", back_populates="review", cascade="all, delete-orphan")
    reply = relationship(
        "ReviewReply", back_populates="review", uselist=False, cascade="all, delete-orphan"
    )


class ReviewPhoto(Base):
    __tablename__ = "review_photos"

    id: Mapped[str] = uuid_pk()
    review_id: Mapped[str] = mapped_column(ForeignKey("reviews.id"), index=True)
    url: Mapped[str] = mapped_column(String(512), nullable=False)

    review = relationship("Review", back_populates="photos")


class ReviewReply(Base, TimestampMixin):
    __tablename__ = "review_replies"

    id: Mapped[str] = uuid_pk()
    review_id: Mapped[str] = mapped_column(ForeignKey("reviews.id"), unique=True, index=True)
    author_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    comment: Mapped[str] = mapped_column(Text)

    review = relationship("Review", back_populates="reply")
