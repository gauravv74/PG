"""Advanced search filter schema (Module 2)."""
from __future__ import annotations

from datetime import date
from enum import Enum

from pydantic import BaseModel, Field

from app.models.enums import Gender, PropertyType, RoomType


class SortOption(str, Enum):
    lowest_price = "lowest_price"
    highest_price = "highest_price"
    closest = "closest"
    highest_rated = "highest_rated"
    newest = "newest"
    most_popular = "most_popular"


class SearchFilters(BaseModel):
    # Location
    city_id: str | None = None
    university_id: str | None = None
    area: str | None = None
    query: str | None = None  # free text: property name / city / university

    # Budget
    price_min: float | None = None
    price_max: float | None = None

    # Types
    room_type: list[RoomType] | None = None
    property_type: list[PropertyType] | None = None
    gender: Gender | None = None

    # Dates / duration
    move_in: date | None = None
    move_out: date | None = None
    duration_months: int | None = None

    # Amenity flags
    bills_included: bool | None = None
    wifi: bool | None = None
    gym: bool | None = None
    laundry: bool | None = None
    parking: bool | None = None
    study_room: bool | None = None
    ac: bool | None = None
    heating: bool | None = None
    private_bathroom: bool | None = None
    kitchen: bool | None = None
    pet_friendly: bool | None = None
    wheelchair_accessible: bool | None = None
    security_24x7: bool | None = None
    cctv: bool | None = None
    elevator: bool | None = None

    # Proximity
    max_distance_km: float | None = None
    max_commute_minutes: int | None = None

    # Booking prefs
    instant_booking: bool | None = None
    flexible_cancellation: bool | None = None
    price_match: bool | None = None
    verified_only: bool | None = None

    # Result control
    sort: SortOption = SortOption.most_popular
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)

    # For distance sorting
    lat: float | None = None
    lng: float | None = None


class Facet(BaseModel):
    key: str
    label: str
    count: int


class SearchFacets(BaseModel):
    property_types: list[Facet] = []
    room_types: list[Facet] = []
    price_buckets: list[Facet] = []
