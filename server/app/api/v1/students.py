"""Student dashboard endpoints (Module 6)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.booking import Booking
from app.models.engagement import SavedSearch, WishlistItem
from app.models.enums import BookingStatus
from app.models.property import Property
from app.models.user import User
from app.schemas.property import PropertyCard

router = APIRouter(prefix="/students", tags=["students"])


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    bookings = db.scalars(select(Booking).where(Booking.student_id == user.id)).all()
    active = [
        b for b in bookings
        if b.status in (BookingStatus.confirmed, BookingStatus.checked_in)
    ]
    return {
        "total_bookings": len(bookings),
        "active_bookings": len(active),
        "loyalty_points": user.loyalty_points,
        "referral_code": user.referral_code,
        "wishlist_count": db.query(WishlistItem).filter(WishlistItem.user_id == user.id).count(),
    }


@router.get("/wishlist", response_model=list[PropertyCard])
def wishlist(
    db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Property]:
    stmt = (
        select(Property)
        .join(WishlistItem, WishlistItem.property_id == Property.id)
        .where(WishlistItem.user_id == user.id)
    )
    return list(db.scalars(stmt).all())


@router.post("/wishlist/{property_id}", status_code=201)
def add_wishlist(
    property_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> dict:
    exists = db.scalar(
        select(WishlistItem).where(
            WishlistItem.user_id == user.id, WishlistItem.property_id == property_id
        )
    )
    if not exists:
        db.add(WishlistItem(user_id=user.id, property_id=property_id))
        db.commit()
    return {"detail": "Added to wishlist"}


@router.delete("/wishlist/{property_id}")
def remove_wishlist(
    property_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> dict:
    db.execute(
        delete(WishlistItem).where(
            WishlistItem.user_id == user.id, WishlistItem.property_id == property_id
        )
    )
    db.commit()
    return {"detail": "Removed"}


@router.get("/saved-searches")
def saved_searches(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(select(SavedSearch).where(SavedSearch.user_id == user.id)).all()
    return [{"id": s.id, "name": s.name, "filters": s.filters, "alert_enabled": s.alert_enabled}
            for s in rows]


@router.post("/saved-searches", status_code=201)
def save_search(
    name: str, filters: dict, alert_enabled: bool = False,
    db: Session = Depends(get_db), user: User = Depends(get_current_user),
) -> dict:
    ss = SavedSearch(user_id=user.id, name=name, filters=filters, alert_enabled=alert_enabled)
    db.add(ss)
    db.commit()
    return {"id": ss.id}
