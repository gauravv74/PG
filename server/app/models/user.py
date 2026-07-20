"""User, host profile, documents, referrals (Modules 6, 7, 11, 17)."""
from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, uuid_pk
from app.models.enums import DocumentType, Gender, UserRole, VerificationStatus


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = uuid_pk()
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.student, index=True)
    gender: Mapped[Gender | None] = mapped_column(Enum(Gender))
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    nationality: Mapped[str | None] = mapped_column(String(80))
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    kyc_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.unverified
    )

    # Loyalty / referral (Module 17)
    loyalty_points: Mapped[int] = mapped_column(Integer, default=0)
    referral_code: Mapped[str | None] = mapped_column(String(16), unique=True, index=True)
    referred_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))

    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    host_profile: Mapped[HostProfile] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    properties = relationship("Property", back_populates="host")
    bookings = relationship("Booking", back_populates="student", foreign_keys="Booking.student_id")
    documents = relationship(
        "Document",
        back_populates="user",
        foreign_keys="Document.user_id",
        cascade="all, delete-orphan",
    )


class HostProfile(Base, TimestampMixin):
    __tablename__ = "host_profiles"

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    company_name: Mapped[str | None] = mapped_column(String(200))
    bio: Mapped[str | None] = mapped_column(Text)
    response_rate: Mapped[float] = mapped_column(Float, default=0.0)
    response_time_minutes: Mapped[int | None] = mapped_column(Integer)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.unverified
    )
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)  # Module 11
    payout_account_id: Mapped[str | None] = mapped_column(String(120))

    user: Mapped[User] = relationship(back_populates="host_profile")


class Document(Base, TimestampMixin):
    __tablename__ = "documents"

    id: Mapped[str] = uuid_pk()
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    doc_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType), nullable=False)
    file_url: Mapped[str] = mapped_column(String(512), nullable=False)
    status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.pending
    )
    reviewed_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    notes: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="documents", foreign_keys=[user_id])


class Referral(Base, TimestampMixin):
    __tablename__ = "referrals"

    id: Mapped[str] = uuid_pk()
    referrer_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    referee_email: Mapped[str] = mapped_column(String(255), index=True)
    referee_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    reward_points: Mapped[int] = mapped_column(Integer, default=0)
    converted: Mapped[bool] = mapped_column(Boolean, default=False)
