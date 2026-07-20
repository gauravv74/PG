"""Property listing + host CRUD (Modules 3, 7)."""
from __future__ import annotations

import re
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_optional_user, require_roles
from app.core.geo import geohash_encode
from app.db.session import get_db
from app.models.engagement import RecentlyViewed
from app.models.enums import PropertyStatus, UserRole
from app.models.property import Property
from app.models.room import Room
from app.models.user import User
from app.schemas.common import Page
from app.schemas.property import (
    PropertyCreate,
    PropertyDetail,
    PropertyListCard,
    PropertyMapPin,
    PropertyMapResponse,
    RoomCreate,
    RoomOut,
)
from app.schemas.search import SearchFilters
from app.services import ai_service, search_service

router = APIRouter(prefix="/properties", tags=["properties"])


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "property"


@router.get("", response_model=Page[PropertyListCard])
def list_properties(
    filters: SearchFilters = Depends(), db: Session = Depends(get_db)
) -> Page[PropertyListCard]:
    """Paginated, filtered, sorted list for the map's list panel.

    Supports bounding-box (north/south/east/west), all filters, sorting and
    pagination — this is the list half of the synchronized map search.
    """
    items, total = search_service.list_cards(db, filters)
    return Page[PropertyListCard](
        items=[
            PropertyListCard.model_validate(search_service.build_list_card(p, filters))
            for p in items
        ],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        has_next=filters.page * filters.page_size < total,
    )


@router.get("/map", response_model=PropertyMapResponse)
def map_properties(
    filters: SearchFilters = Depends(), db: Session = Depends(get_db)
) -> PropertyMapResponse:
    """Lightweight markers for every property inside the current viewport.

    Returns up to ``MAX_MAP_PINS`` markers plus the true ``total`` so the client
    can show "Showing N properties in this area" and decide when to cluster.
    """
    items, total, truncated = search_service.map_pins(db, filters)
    # Markers stay lightweight — no per-row relationship loads (avoids N+1 on
    # thousands of pins). Room type / details are hydrated lazily via the list.
    pins = [
        PropertyMapPin(
            id=p.id,
            slug=p.slug,
            name=p.name,
            latitude=p.latitude,
            longitude=p.longitude,
            geohash=p.geohash,
            min_price=float(p.min_price) if p.min_price is not None else None,
            currency=p.currency,
            avg_rating=p.avg_rating,
            cover_image_url=p.cover_image_url,
            is_verified=p.is_verified,
        )
        for p in items
    ]
    return PropertyMapResponse(items=pins, total=total, truncated=truncated)


@router.get("/{slug}", response_model=PropertyDetail)
def get_property(
    slug: str,
    db: Session = Depends(get_db),
    user: User | None = Depends(get_optional_user),
) -> Property:
    prop = db.scalar(
        select(Property)
        .where(Property.slug == slug)
        .options(
            selectinload(Property.images),
            selectinload(Property.rooms).selectinload(Room.pricing),
            selectinload(Property.pois),
            selectinload(Property.offers),
            selectinload(Property.policies),
        )
    )
    if not prop:
        raise HTTPException(404, "Property not found")
    prop.view_count += 1
    if user:
        db.merge(
            RecentlyViewed(
                user_id=user.id, property_id=prop.id, viewed_at=datetime.now(UTC)
            )
        )
    db.commit()
    return prop


@router.get("/{slug}/similar", response_model=list[PropertyDetail])
def similar(slug: str, db: Session = Depends(get_db)) -> list[Property]:
    prop = db.scalar(select(Property).where(Property.slug == slug))
    if not prop:
        raise HTTPException(404, "Property not found")
    return ai_service.similar_properties(db, prop.id)


@router.post("", response_model=PropertyDetail, status_code=201)
def create_property(
    data: PropertyCreate,
    db: Session = Depends(get_db),
    host: User = Depends(require_roles(UserRole.host)),
) -> Property:
    prop = Property(
        host_id=host.id,
        city_id=data.city_id,
        name=data.name,
        slug=f"{_slugify(data.name)}-{host.id[:6]}",
        property_type=data.property_type,
        address=data.address,
        latitude=data.latitude,
        longitude=data.longitude,
        geohash=geohash_encode(data.latitude, data.longitude),
        summary=data.summary,
        description=data.description,
        bills_included=data.bills_included,
        instant_booking=data.instant_booking,
        status=PropertyStatus.draft,
    )
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.post("/{property_id}/rooms", response_model=RoomOut, status_code=201)
def add_room(
    property_id: str,
    data: RoomCreate,
    db: Session = Depends(get_db),
    host: User = Depends(require_roles(UserRole.host)),
) -> Room:
    prop = db.get(Property, property_id)
    if not prop or prop.host_id != host.id:
        raise HTTPException(404, "Property not found")
    room = Room(property_id=property_id, **data.model_dump())
    db.add(room)
    if prop.min_price is None or data.base_price < float(prop.min_price):
        prop.min_price = data.base_price
    db.commit()
    db.refresh(room)
    return room


@router.post("/{property_id}/submit", response_model=PropertyDetail)
def submit_for_review(
    property_id: str,
    db: Session = Depends(get_db),
    host: User = Depends(require_roles(UserRole.host)),
) -> Property:
    prop = db.get(Property, property_id)
    if not prop or prop.host_id != host.id:
        raise HTTPException(404, "Property not found")
    prop.status = PropertyStatus.pending_review
    db.commit()
    db.refresh(prop)
    return prop
