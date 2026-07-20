"""Property, media, amenities, POIs, offers, policies, FAQs, verification (Modules 3, 11, 12)."""
from __future__ import annotations

from sqlalchemy import (
    Boolean,
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
from app.models.enums import (
    POIType,
    PropertyStatus,
    PropertyType,
    VerificationStatus,
)


class Property(Base, TimestampMixin):
    __tablename__ = "properties"

    id: Mapped[str] = uuid_pk()
    host_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id"), index=True, nullable=False)

    name: Mapped[str] = mapped_column(String(200), index=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True, nullable=False)
    property_type: Mapped[PropertyType] = mapped_column(Enum(PropertyType), index=True)
    status: Mapped[PropertyStatus] = mapped_column(
        Enum(PropertyStatus), default=PropertyStatus.draft, index=True
    )

    summary: Mapped[str | None] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text)
    address: Mapped[str] = mapped_column(String(400), nullable=False)
    postal_code: Mapped[str | None] = mapped_column(String(20))
    latitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, index=True, nullable=False)

    # Denormalised for fast search/sort (Module 2, 16)
    min_price: Mapped[float | None] = mapped_column(Numeric(12, 2), index=True)
    currency: Mapped[str] = mapped_column(String(3), default="INR")
    avg_rating: Mapped[float] = mapped_column(Float, default=0.0, index=True)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    view_count: Mapped[int] = mapped_column(Integer, default=0, index=True)

    # Media / tours (Module 3)
    cover_image_url: Mapped[str | None] = mapped_column(String(512))
    video_tour_url: Mapped[str | None] = mapped_column(String(512))
    tour_360_url: Mapped[str | None] = mapped_column(String(512))
    floor_plan_url: Mapped[str | None] = mapped_column(String(512))

    # Flags (Module 2 filters)
    instant_booking: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    flexible_cancellation: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    price_match: Mapped[bool] = mapped_column(Boolean, default=False)
    bills_included: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    host = relationship("User", back_populates="properties")
    city = relationship("City", back_populates="properties")
    images = relationship(
        "PropertyImage", back_populates="property", cascade="all, delete-orphan"
    )
    rooms = relationship("Room", back_populates="property", cascade="all, delete-orphan")
    amenities = relationship(
        "PropertyAmenity", back_populates="property", cascade="all, delete-orphan"
    )
    universities = relationship(
        "PropertyUniversity", back_populates="property", cascade="all, delete-orphan"
    )
    pois = relationship("NearbyPOI", back_populates="property", cascade="all, delete-orphan")
    offers = relationship("Offer", back_populates="property", cascade="all, delete-orphan")
    policies = relationship("Policy", back_populates="property", cascade="all, delete-orphan")
    faqs = relationship("PropertyFAQ", back_populates="property", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="property")
    verification = relationship(
        "Verification", back_populates="property", uselist=False, cascade="all, delete-orphan"
    )


class PropertyImage(Base):
    __tablename__ = "property_images"

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    url: Mapped[str] = mapped_column(String(512), nullable=False)
    caption: Mapped[str | None] = mapped_column(String(200))
    is_cover: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    property = relationship("Property", back_populates="images")


class Amenity(Base):
    __tablename__ = "amenities"

    id: Mapped[str] = uuid_pk()
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(90), unique=True, index=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(80))
    category: Mapped[str | None] = mapped_column(String(60))


class PropertyAmenity(Base):
    __tablename__ = "property_amenities"
    __table_args__ = (UniqueConstraint("property_id", "amenity_id"),)

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    amenity_id: Mapped[str] = mapped_column(ForeignKey("amenities.id"), index=True)

    property = relationship("Property", back_populates="amenities")
    amenity = relationship("Amenity")


class PropertyUniversity(Base):
    """Join table with precomputed distance/commute (Module 2, 12)."""

    __tablename__ = "property_universities"
    __table_args__ = (UniqueConstraint("property_id", "university_id"),)

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    university_id: Mapped[str] = mapped_column(ForeignKey("universities.id"), index=True)
    distance_km: Mapped[float] = mapped_column(Float, index=True)
    walking_minutes: Mapped[int | None] = mapped_column(Integer)
    driving_minutes: Mapped[int | None] = mapped_column(Integer)
    transit_minutes: Mapped[int | None] = mapped_column(Integer)

    property = relationship("Property", back_populates="universities")
    university = relationship("University")


class NearbyPOI(Base):
    __tablename__ = "nearby_pois"

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    poi_type: Mapped[POIType] = mapped_column(Enum(POIType), index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    distance_km: Mapped[float] = mapped_column(Float)
    walking_minutes: Mapped[int | None] = mapped_column(Integer)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)

    property = relationship("Property", back_populates="pois")


class Offer(Base, TimestampMixin):
    __tablename__ = "offers"

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    discount_percent: Mapped[float | None] = mapped_column(Float)
    is_student_discount: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)

    property = relationship("Property", back_populates="offers")


class Policy(Base):
    __tablename__ = "policies"

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    policy_type: Mapped[str] = mapped_column(String(40))  # cancellation | deposit | house_rules
    title: Mapped[str] = mapped_column(String(160))
    content: Mapped[str] = mapped_column(Text)

    property = relationship("Property", back_populates="policies")


class PropertyFAQ(Base):
    __tablename__ = "property_faqs"

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), index=True)
    question: Mapped[str] = mapped_column(String(300))
    answer: Mapped[str] = mapped_column(Text)

    property = relationship("Property", back_populates="faqs")


class Verification(Base, TimestampMixin):
    """Property verification record (Module 11)."""

    __tablename__ = "verifications"

    id: Mapped[str] = uuid_pk()
    property_id: Mapped[str] = mapped_column(ForeignKey("properties.id"), unique=True, index=True)
    status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.pending, index=True
    )
    quality_score: Mapped[float] = mapped_column(Float, default=0.0)
    reviewed_by_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"))
    notes: Mapped[str | None] = mapped_column(Text)

    property = relationship("Property", back_populates="verification")
