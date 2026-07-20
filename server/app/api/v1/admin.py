"""Admin dashboard: moderation, verification, CMS, revenue (Module 8, 11)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import require_roles
from app.db.session import get_db
from app.models.booking import Booking, Coupon, Payment
from app.models.enums import PaymentStatus, PropertyStatus, UserRole, VerificationStatus
from app.models.property import Property, Verification
from app.models.review import Review
from app.models.user import User

router = APIRouter(
    prefix="/admin", tags=["admin"], dependencies=[Depends(require_roles(UserRole.admin))]
)

COMMISSION_RATE = 0.12


@router.get("/overview")
def overview(db: Session = Depends(get_db)) -> dict:
    gmv = db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.status == PaymentStatus.succeeded
        )
    ) or 0
    return {
        "users": db.scalar(select(func.count(User.id))) or 0,
        "hosts": db.scalar(select(func.count(User.id)).where(User.role == UserRole.host)) or 0,
        "properties": db.scalar(select(func.count(Property.id))) or 0,
        "bookings": db.scalar(select(func.count(Booking.id))) or 0,
        "gmv": float(gmv),
        "commission_revenue": round(float(gmv) * COMMISSION_RATE, 2),
        "pending_verifications": db.scalar(
            select(func.count(Verification.id)).where(
                Verification.status == VerificationStatus.pending
            )
        ) or 0,
        "flagged_reviews": db.scalar(
            select(func.count(Review.id)).where(Review.is_flagged.is_(True))
        ) or 0,
    }


@router.get("/properties/pending")
def pending_properties(db: Session = Depends(get_db)):
    props = db.scalars(
        select(Property).where(Property.status == PropertyStatus.pending_review)
    ).all()
    return [{"id": p.id, "name": p.name, "host_id": p.host_id, "city_id": p.city_id} for p in props]


@router.post("/properties/{property_id}/moderate")
def moderate_property(
    property_id: str, approve: bool, quality_score: float = 0.0,
    notes: str | None = None, db: Session = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.admin)),
) -> dict:
    prop = db.get(Property, property_id)
    if not prop:
        raise HTTPException(404, "Property not found")
    prop.status = PropertyStatus.active if approve else PropertyStatus.rejected
    prop.is_verified = approve
    verification = prop.verification or Verification(property_id=prop.id)
    verification.status = VerificationStatus.verified if approve else VerificationStatus.rejected
    verification.quality_score = quality_score
    verification.reviewed_by_id = admin.id
    verification.notes = notes
    db.merge(verification)
    db.commit()
    return {"detail": "Property moderated", "status": prop.status}


@router.post("/reviews/{review_id}/moderate")
def moderate_review(
    review_id: str, remove: bool = False, db: Session = Depends(get_db)
) -> dict:
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(404, "Review not found")
    if remove:
        db.delete(review)
    else:
        review.is_flagged = False
    db.commit()
    return {"detail": "Review moderated"}


@router.post("/coupons", status_code=201)
def create_coupon(
    code: str, discount_percent: float | None = None, discount_flat: float | None = None,
    max_discount: float | None = None, db: Session = Depends(get_db),
) -> dict:
    coupon = Coupon(
        code=code, discount_percent=discount_percent, discount_flat=discount_flat,
        max_discount=max_discount,
    )
    db.add(coupon)
    db.commit()
    return {"id": coupon.id, "code": coupon.code}
