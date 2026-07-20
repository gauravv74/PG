"""Server-side search with 30+ filters, sorting, facets (Module 2, 16)."""
from __future__ import annotations

import hashlib
import json
import math

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import PropertyStatus
from app.models.property import Amenity, Property, PropertyAmenity, PropertyUniversity
from app.schemas.search import SearchFilters, SortOption

# Map filter flag -> amenity slug for amenity-based filters.
AMENITY_FLAGS = {
    "wifi": "wifi",
    "gym": "gym",
    "laundry": "laundry",
    "parking": "parking",
    "study_room": "study-room",
    "ac": "ac",
    "heating": "heating",
    "pet_friendly": "pet-friendly",
    "wheelchair_accessible": "wheelchair-accessible",
    "security_24x7": "security-24x7",
    "cctv": "cctv",
    "elevator": "elevator",
}


def cache_key(filters: SearchFilters) -> str:
    raw = json.dumps(filters.model_dump(mode="json"), sort_keys=True)
    return "search:" + hashlib.sha256(raw.encode()).hexdigest()[:24]


def _haversine(lat1, lng1, lat2, lng2) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def _base_query(f: SearchFilters) -> Select:
    stmt = select(Property).where(Property.status == PropertyStatus.active)

    if f.city_id:
        stmt = stmt.where(Property.city_id == f.city_id)
    if f.query:
        like = f"%{f.query.lower()}%"
        stmt = stmt.where(func.lower(Property.name).like(like))
    if f.property_type:
        stmt = stmt.where(Property.property_type.in_(f.property_type))
    if f.price_min is not None:
        stmt = stmt.where(Property.min_price >= f.price_min)
    if f.price_max is not None:
        stmt = stmt.where(Property.min_price <= f.price_max)
    if f.bills_included:
        stmt = stmt.where(Property.bills_included.is_(True))
    if f.instant_booking:
        stmt = stmt.where(Property.instant_booking.is_(True))
    if f.flexible_cancellation:
        stmt = stmt.where(Property.flexible_cancellation.is_(True))
    if f.price_match:
        stmt = stmt.where(Property.price_match.is_(True))
    if f.verified_only:
        stmt = stmt.where(Property.is_verified.is_(True))

    # University proximity via join table
    if f.university_id:
        stmt = stmt.join(PropertyUniversity).where(
            PropertyUniversity.university_id == f.university_id
        )
        if f.max_distance_km is not None:
            stmt = stmt.where(PropertyUniversity.distance_km <= f.max_distance_km)
        if f.max_commute_minutes is not None:
            stmt = stmt.where(
                or_(
                    PropertyUniversity.walking_minutes <= f.max_commute_minutes,
                    PropertyUniversity.transit_minutes <= f.max_commute_minutes,
                )
            )

    # Amenity flags (each requires an EXISTS subquery)
    active_amenities = [slug for flag, slug in AMENITY_FLAGS.items() if getattr(f, flag)]
    for slug in active_amenities:
        exists_q = (
            select(PropertyAmenity.id)
            .join(Amenity)
            .where(and_(PropertyAmenity.property_id == Property.id, Amenity.slug == slug))
        )
        stmt = stmt.where(exists_q.exists())

    return stmt


def _apply_sort(stmt: Select, f: SearchFilters) -> Select:
    if f.sort == SortOption.lowest_price:
        return stmt.order_by(Property.min_price.asc().nullslast())
    if f.sort == SortOption.highest_price:
        return stmt.order_by(Property.min_price.desc().nullslast())
    if f.sort == SortOption.highest_rated:
        return stmt.order_by(Property.avg_rating.desc())
    if f.sort == SortOption.newest:
        return stmt.order_by(Property.created_at.desc())
    if f.sort == SortOption.closest and f.university_id:
        return stmt.order_by(PropertyUniversity.distance_km.asc())
    # most_popular
    return stmt.order_by(Property.view_count.desc(), Property.avg_rating.desc())


def search(db: Session, f: SearchFilters) -> tuple[list[Property], int]:
    stmt = _base_query(f)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    stmt = _apply_sort(stmt, f)
    stmt = stmt.options(selectinload(Property.images))
    stmt = stmt.offset((f.page - 1) * f.page_size).limit(f.page_size)
    items = list(db.scalars(stmt).unique().all())

    # Client-side distance sort fallback when lat/lng provided without university
    if f.sort == SortOption.closest and f.lat is not None and f.lng is not None:
        items.sort(key=lambda p: _haversine(f.lat, f.lng, p.latitude, p.longitude))

    return items, total
