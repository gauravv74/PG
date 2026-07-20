"""Reviews & ratings (Module 10)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.booking import Booking
from app.models.enums import BookingStatus
from app.models.property import Property
from app.models.review import Review, ReviewPhoto
from app.models.user import User
from app.schemas.booking import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("/property/{property_id}", response_model=list[ReviewOut])
def property_reviews(property_id: str, db: Session = Depends(get_db)) -> list[Review]:
    return list(
        db.scalars(
            select(Review)
            .where(Review.property_id == property_id)
            .order_by(Review.created_at.desc())
        ).all()
    )


@router.post("", response_model=ReviewOut, status_code=201)
def create_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Review:
    # Verified review = user has a completed booking for this property.
    verified = False
    if data.booking_id:
        booking = db.get(Booking, data.booking_id)
        verified = bool(
            booking
            and booking.student_id == user.id
            and booking.property_id == data.property_id
            and booking.status in (BookingStatus.completed, BookingStatus.checked_in)
        )

    review = Review(
        property_id=data.property_id,
        author_id=user.id,
        booking_id=data.booking_id,
        rating=data.rating,
        cleanliness=data.cleanliness,
        location_rating=data.location_rating,
        value_rating=data.value_rating,
        facilities_rating=data.facilities_rating,
        title=data.title,
        comment=data.comment,
        is_verified=verified,
    )
    db.add(review)
    db.flush()
    for url in data.photo_urls:
        db.add(ReviewPhoto(review_id=review.id, url=url))

    # Recompute denormalised rating aggregates.
    prop = db.get(Property, data.property_id)
    if prop:
        agg = db.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.property_id == data.property_id
            )
        ).one()
        prop.avg_rating = round(float(agg[0] or 0), 2)
        prop.review_count = int(agg[1] or 0)
    db.commit()
    db.refresh(review)
    return review


@router.post("/{review_id}/reply", response_model=ReviewOut)
def reply(
    review_id: str,
    comment: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Review:
    from app.models.review import ReviewReply

    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(404, "Review not found")
    db.add(ReviewReply(review_id=review_id, author_id=user.id, comment=comment))
    db.commit()
    db.refresh(review)
    return review


@router.post("/{review_id}/report", status_code=202)
def report(review_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(404, "Review not found")
    review.is_flagged = True
    db.commit()
    return {"detail": "Review reported for moderation"}
