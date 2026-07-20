"""Server-side search with 30+ filters, sorting, facets (Module 2, 16)."""
from __future__ import annotations

import hashlib
import json

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.geo import haversine_km
from app.models.enums import PropertyStatus
from app.models.property import Amenity, Property, PropertyAmenity, PropertyUniversity
from app.models.room import Room
from app.schemas.search import SearchFilters, SortOption

# Cap on markers returned by the map endpoint in a single response. Beyond this
# the client is told to keep clustering / zoom in (Map Clustering module).
MAX_MAP_PINS = 2000

# Map filter flag -> amenity slug for amenity-based filters.
AMENITY_FLAGS = {
    "wifi": "wifi",
    "gym": "gym",
    "laundry": "laundry",
    "parking": "parking",
    "study_room": "study-room",
    "study_table": "study-table",
    "ac": "ac",
    "heating": "heating",
    "food_included": "meals",
    "pet_friendly": "pet-friendly",
    "wheelchair_accessible": "wheelchair-accessible",
    "security_24x7": "security-24x7",
    "cctv": "cctv",
    "elevator": "elevator",
}


def cache_key(filters: SearchFilters) -> str:
    raw = json.dumps(filters.model_dump(mode="json"), sort_keys=True)
    return "search:" + hashlib.sha256(raw.encode()).hexdigest()[:24]


# Backwards-compatible alias (kept for existing callers/tests).
def _haversine(lat1, lng1, lat2, lng2) -> float:
    return haversine_km(lat1, lng1, lat2, lng2)


def _origin(f: SearchFilters) -> tuple[float, float] | None:
    """Resolve the reference point for distance calc / nearest sort.

    Priority: explicit lat/lng (searched location) -> viewport center.
    """
    if f.lat is not None and f.lng is not None:
        return f.lat, f.lng
    if f.has_bbox:
        return (f.north + f.south) / 2, (f.east + f.west) / 2
    return None


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
    active_amenities = [slug for flag, slug in AMENITY_FLAGS.items() if getattr(f, flag, None)]
    for slug in active_amenities:
        exists_q = (
            select(PropertyAmenity.id)
            .join(Amenity)
            .where(and_(PropertyAmenity.property_id == Property.id, Amenity.slug == slug))
        )
        stmt = stmt.where(exists_q.exists())

    # Deposit ceiling — matches if the property has at least one room within budget.
    if f.deposit_max is not None:
        deposit_q = select(Room.id).where(
            and_(Room.property_id == Property.id, Room.security_deposit <= f.deposit_max)
        )
        stmt = stmt.where(deposit_q.exists())

    # Availability — at least one room with live inventory.
    if f.available_only:
        avail_q = select(Room.id).where(
            and_(Room.property_id == Property.id, Room.total_units > 0)
        )
        stmt = stmt.where(avail_q.exists())

    stmt = _apply_bbox(stmt, f)
    return stmt


def _apply_bbox(stmt: Select, f: SearchFilters) -> Select:
    """Restrict to properties inside the Google Maps viewport (bounding box)."""
    if not f.has_bbox:
        return stmt
    stmt = stmt.where(Property.latitude.between(f.south, f.north))
    if f.west <= f.east:
        stmt = stmt.where(Property.longitude.between(f.west, f.east))
    else:
        # Viewport dragged across the anti-meridian (+/-180).
        stmt = stmt.where(
            or_(Property.longitude >= f.west, Property.longitude <= f.east)
        )
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
    if f.sort in (SortOption.closest, SortOption.nearest) and f.university_id:
        return stmt.order_by(PropertyUniversity.distance_km.asc())
    if f.sort == SortOption.recommended:
        return stmt.order_by(
            Property.is_featured.desc(),
            Property.avg_rating.desc(),
            Property.view_count.desc(),
        )
    # most_popular
    return stmt.order_by(Property.view_count.desc(), Property.avg_rating.desc())


def _distance_sort(items: list[Property], f: SearchFilters) -> None:
    """In-place nearest sort against the resolved origin (no university join)."""
    if f.sort not in (SortOption.closest, SortOption.nearest) or f.university_id:
        return
    origin = _origin(f)
    if origin is None:
        return
    olat, olng = origin
    items.sort(key=lambda p: haversine_km(olat, olng, p.latitude, p.longitude))


def search(db: Session, f: SearchFilters) -> tuple[list[Property], int]:
    stmt = _base_query(f)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    stmt = _apply_sort(stmt, f)
    stmt = stmt.options(selectinload(Property.images))
    stmt = stmt.offset((f.page - 1) * f.page_size).limit(f.page_size)
    items = list(db.scalars(stmt).unique().all())

    _distance_sort(items, f)
    return items, total


def list_cards(db: Session, f: SearchFilters) -> tuple[list[Property], int]:
    """Paginated list for the map's synchronized list panel.

    Eager-loads rooms + amenities so the router can build the rich
    ``PropertyListCard`` (deposit, beds, room types, amenities) without N+1s.
    """
    stmt = _base_query(f)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    stmt = _apply_sort(stmt, f)
    stmt = stmt.options(
        selectinload(Property.images),
        selectinload(Property.rooms),
        selectinload(Property.amenities).selectinload(PropertyAmenity.amenity),
    )
    stmt = stmt.offset((f.page - 1) * f.page_size).limit(f.page_size)
    items = list(db.scalars(stmt).unique().all())

    _distance_sort(items, f)
    return items, total


def map_pins(
    db: Session, f: SearchFilters, limit: int = MAX_MAP_PINS
) -> tuple[list[Property], int, bool]:
    """Lightweight markers for the whole viewport.

    Returns (properties, total_matching, truncated). Ignores pagination — the map
    shows every marker in bounds up to ``limit`` — and never runs the expensive
    per-card eager loads.
    """
    stmt = _base_query(f)
    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

    stmt = _apply_sort(stmt, f).limit(limit)
    items = list(db.scalars(stmt).unique().all())

    _distance_sort(items, f)
    return items, total, total > len(items)


def build_list_card(p: Property, f: SearchFilters) -> dict:
    """Assemble the enriched card payload from an eager-loaded Property."""
    rooms = list(p.rooms or [])
    deposits = [float(r.security_deposit) for r in rooms if r.security_deposit is not None]
    room_types = sorted({r.room_type for r in rooms}, key=lambda rt: rt.value)
    amenities = sorted({pa.amenity.slug for pa in (p.amenities or []) if pa.amenity})

    distance_km = None
    origin = _origin(f)
    if origin is not None:
        distance_km = round(haversine_km(origin[0], origin[1], p.latitude, p.longitude), 2)

    return {
        **{c.name: getattr(p, c.name) for c in p.__table__.columns},
        "area": (p.address or "").split(",")[-1].strip() or None,
        "min_deposit": min(deposits) if deposits else None,
        "available_beds": sum((r.total_units or 0) for r in rooms),
        "room_types": room_types,
        "amenities": amenities,
        "distance_km": distance_km,
    }
