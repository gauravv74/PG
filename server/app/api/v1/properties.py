"""Property listing + host CRUD (Modules 3, 7)."""
from __future__ import annotations

import re
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_optional_user, require_roles
from app.db.session import get_db
from app.models.engagement import RecentlyViewed
from app.models.enums import PropertyStatus, UserRole
from app.models.property import Property
from app.models.room import Room
from app.models.user import User
from app.schemas.property import PropertyCreate, PropertyDetail, RoomCreate, RoomOut
from app.services import ai_service

router = APIRouter(prefix="/properties", tags=["properties"])


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "property"


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
