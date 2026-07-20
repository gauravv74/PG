"""Conversations & messages with read receipts (Module 9)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, uuid_pk

conversation_participants = Table(
    "conversation_participants",
    Base.metadata,
    Column("conversation_id", ForeignKey("conversations.id"), primary_key=True),
    Column("user_id", ForeignKey("users.id"), primary_key=True),
)


class Conversation(Base, TimestampMixin):
    __tablename__ = "conversations"

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str | None] = mapped_column(ForeignKey("properties.id"), index=True)
    booking_id: Mapped[str | None] = mapped_column(ForeignKey("bookings.id"))
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    participants = relationship("User", secondary=conversation_participants)
    messages = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )


class Message(Base, TimestampMixin):
    __tablename__ = "messages"

    id: Mapped[str] = uuid_pk()
    conversation_id: Mapped[str] = mapped_column(ForeignKey("conversations.id"), index=True)
    sender_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    body: Mapped[str | None] = mapped_column(Text)
    attachment_url: Mapped[str | None] = mapped_column(String(512))
    attachment_type: Mapped[str | None] = mapped_column(String(20))  # image | pdf
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    conversation = relationship("Conversation", back_populates="messages")
