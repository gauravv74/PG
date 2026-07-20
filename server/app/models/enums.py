"""Enumerations used across the domain model."""
from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    student = "student"
    host = "host"
    admin = "admin"
    support = "support"


class Gender(str, enum.Enum):
    male = "male"
    female = "female"
    any = "any"
    other = "other"


class RoomType(str, enum.Enum):
    shared = "shared"
    private = "private"
    ensuite = "ensuite"
    studio = "studio"
    apartment = "apartment"
    entire_house = "entire_house"
    twin_sharing = "twin_sharing"
    triple_sharing = "triple_sharing"


class PropertyType(str, enum.Enum):
    pbsa = "pbsa"  # purpose-built student accommodation
    private_hall = "private_hall"
    apartment = "apartment"
    house = "house"
    pg = "pg"  # paying guest / hostel
    homestay = "homestay"


class PropertyStatus(str, enum.Enum):
    draft = "draft"
    pending_review = "pending_review"
    active = "active"
    inactive = "inactive"
    rejected = "rejected"


class BookingStatus(str, enum.Enum):
    quote = "quote"
    pending = "pending"
    confirmed = "confirmed"
    checked_in = "checked_in"
    completed = "completed"
    cancelled = "cancelled"
    refunded = "refunded"


class PaymentStatus(str, enum.Enum):
    pending = "pending"
    succeeded = "succeeded"
    failed = "failed"
    refunded = "refunded"
    partially_refunded = "partially_refunded"


class VerificationStatus(str, enum.Enum):
    unverified = "unverified"
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class DocumentType(str, enum.Enum):
    id_proof = "id_proof"
    passport = "passport"
    visa = "visa"
    enrollment_letter = "enrollment_letter"
    address_proof = "address_proof"
    property_deed = "property_deed"
    rental_agreement = "rental_agreement"


class NotificationChannel(str, enum.Enum):
    email = "email"
    sms = "sms"
    whatsapp = "whatsapp"
    push = "push"
    in_app = "in_app"


class TicketStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    closed = "closed"


class POIType(str, enum.Enum):
    university = "university"
    metro = "metro"
    bus_stop = "bus_stop"
    grocery = "grocery"
    restaurant = "restaurant"
    hospital = "hospital"
    cafe = "cafe"
    market = "market"
