"""Property, room, discovery schemas (Modules 1, 3, 4)."""
from __future__ import annotations

from datetime import date

from pydantic import BaseModel

from app.models.enums import Gender, POIType, PropertyStatus, PropertyType, RoomType
from app.schemas.common import ORMModel


class AmenityOut(ORMModel):
    id: str
    name: str
    slug: str
    icon: str | None = None
    category: str | None = None


class RoomPricingOut(ORMModel):
    min_duration_months: int
    price_per_month: float
    label: str | None = None


class RoomOut(ORMModel):
    id: str
    name: str
    room_type: RoomType
    description: str | None = None
    base_price: float
    currency: str
    security_deposit: float
    cleaning_fee: float
    max_occupancy: int
    total_units: int
    size_sqft: int | None = None
    gender_policy: Gender
    has_private_bathroom: bool
    has_kitchen: bool
    has_ac: bool
    floor_plan_url: str | None = None
    pricing: list[RoomPricingOut] = []


class PropertyImageOut(ORMModel):
    id: str
    url: str
    caption: str | None = None
    is_cover: bool
    sort_order: int


class NearbyPOIOut(ORMModel):
    poi_type: POIType
    name: str
    distance_km: float
    walking_minutes: int | None = None


class OfferOut(ORMModel):
    id: str
    title: str
    description: str | None = None
    discount_percent: float | None = None
    is_student_discount: bool


class PolicyOut(ORMModel):
    policy_type: str
    title: str
    content: str


class PropertyCard(ORMModel):
    """Compact card for search results / listings (Module 2)."""

    id: str
    name: str
    slug: str
    property_type: PropertyType
    status: PropertyStatus
    city_id: str
    summary: str | None = None
    cover_image_url: str | None = None
    min_price: float | None = None
    currency: str
    avg_rating: float
    review_count: int
    latitude: float
    longitude: float
    is_verified: bool
    is_featured: bool
    instant_booking: bool


class PropertyMapPin(ORMModel):
    """Ultra-light payload for a single map marker (Map Search).

    Deliberately tiny so the /properties/map endpoint can return thousands of
    markers in one response with minimal bandwidth.
    """

    id: str
    slug: str
    name: str
    latitude: float
    longitude: float
    geohash: str | None = None
    min_price: float | None = None
    currency: str
    avg_rating: float
    room_type: RoomType | None = None
    cover_image_url: str | None = None
    is_verified: bool


class PropertyMapResponse(BaseModel):
    """Marker payload + count for the current viewport."""

    items: list[PropertyMapPin]
    total: int
    truncated: bool = False  # True when total > returned markers (client should cluster/zoom)


class PropertyListCard(PropertyCard):
    """Rich card for the synchronized list panel (Map Search).

    Extends the compact card with fields the design calls for: address/area,
    deposit, available beds, room types, amenities and (optional) distance from
    the searched location.
    """

    address: str | None = None
    area: str | None = None
    min_deposit: float | None = None
    available_beds: int = 0
    room_types: list[RoomType] = []
    amenities: list[str] = []
    bills_included: bool = False
    distance_km: float | None = None  # from search origin / viewport center when known


class PropertyDetail(PropertyCard):
    """Full property detail (Module 3)."""

    description: str | None = None
    address: str
    postal_code: str | None = None
    video_tour_url: str | None = None
    tour_360_url: str | None = None
    floor_plan_url: str | None = None
    bills_included: bool
    flexible_cancellation: bool
    price_match: bool
    view_count: int
    images: list[PropertyImageOut] = []
    rooms: list[RoomOut] = []
    pois: list[NearbyPOIOut] = []
    offers: list[OfferOut] = []
    policies: list[PolicyOut] = []


class PropertyCreate(BaseModel):
    name: str
    property_type: PropertyType
    city_id: str
    address: str
    latitude: float
    longitude: float
    summary: str | None = None
    description: str | None = None
    bills_included: bool = False
    instant_booking: bool = False


class RoomCreate(BaseModel):
    name: str
    room_type: RoomType
    base_price: float
    security_deposit: float = 0
    cleaning_fee: float = 0
    max_occupancy: int = 1
    total_units: int = 1
    gender_policy: Gender = Gender.any
    description: str | None = None


class CityOut(ORMModel):
    id: str
    name: str
    slug: str
    country: str
    image_url: str | None = None
    is_trending: bool
    property_count: int


class UniversityOut(ORMModel):
    id: str
    name: str
    slug: str
    city_id: str
    logo_url: str | None = None
    is_top: bool
    latitude: float
    longitude: float


class AvailabilityQuery(BaseModel):
    check_in: date
    check_out: date
