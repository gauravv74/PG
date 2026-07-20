"""Landing page discovery endpoints (Module 1)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.deps import get_optional_user
from app.db.session import get_db
from app.models.engagement import FAQ, BlogPost, RecentlyViewed, Testimonial
from app.models.enums import PropertyStatus
from app.models.location import City, University
from app.models.property import Offer, Property
from app.models.user import User
from app.schemas.property import CityOut, PropertyCard, UniversityOut

router = APIRouter(prefix="/discovery", tags=["discovery"])


@router.get("/cities", response_model=list[CityOut])
def all_cities(db: Session = Depends(get_db)) -> list[City]:
    return list(db.scalars(select(City).order_by(City.name)).all())


@router.get("/trending-cities", response_model=list[CityOut])
def trending_cities(db: Session = Depends(get_db)) -> list[City]:
    return list(
        db.scalars(
            select(City).where(City.is_trending.is_(True)).order_by(City.property_count.desc())
        ).all()
    )


@router.get("/featured-properties", response_model=list[PropertyCard])
def featured(db: Session = Depends(get_db)) -> list[Property]:
    return list(
        db.scalars(
            select(Property)
            .where(Property.is_featured.is_(True), Property.status == PropertyStatus.active)
            .options(selectinload(Property.images))
            .limit(12)
        ).all()
    )


@router.get("/recommended", response_model=list[PropertyCard])
def recommended(db: Session = Depends(get_db)) -> list[Property]:
    return list(
        db.scalars(
            select(Property)
            .where(Property.status == PropertyStatus.active)
            .order_by(Property.avg_rating.desc(), Property.view_count.desc())
            .limit(12)
        ).all()
    )


@router.get("/top-universities", response_model=list[UniversityOut])
def top_universities(db: Session = Depends(get_db)) -> list[University]:
    return list(db.scalars(select(University).where(University.is_top.is_(True)).limit(12)).all())


@router.get("/special-offers", response_model=list[PropertyCard])
def special_offers(db: Session = Depends(get_db)) -> list[Property]:
    stmt = (
        select(Property)
        .join(Offer)
        .where(Offer.active.is_(True), Property.status == PropertyStatus.active)
        .options(selectinload(Property.images))
        .limit(12)
    )
    return list(db.scalars(stmt).unique().all())


@router.get("/recently-viewed", response_model=list[PropertyCard])
def recently_viewed(
    db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)
) -> list[Property]:
    if not user:
        return []
    stmt = (
        select(Property)
        .join(RecentlyViewed, RecentlyViewed.property_id == Property.id)
        .where(RecentlyViewed.user_id == user.id)
        .order_by(RecentlyViewed.viewed_at.desc())
        .limit(8)
    )
    return list(db.scalars(stmt).all())


@router.get("/testimonials")
def testimonials(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(Testimonial).where(Testimonial.is_featured.is_(True)).limit(9)).all()
    return [
        {
            "id": t.id,
            "author_name": t.author_name,
            "author_role": t.author_role,
            "avatar_url": t.avatar_url,
            "rating": t.rating,
            "quote": t.quote,
        }
        for t in rows
    ]


@router.get("/stats")
def stats(db: Session = Depends(get_db)) -> dict:
    from sqlalchemy import func

    return {
        "properties": db.scalar(select(func.count(Property.id))) or 0,
        "cities": db.scalar(select(func.count(City.id))) or 0,
        "universities": db.scalar(select(func.count(University.id))) or 0,
        "students_served": 250000,
        "avg_rating": 4.8,
    }


@router.get("/blogs")
def blogs(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(
        select(BlogPost).where(BlogPost.published.is_(True)).order_by(BlogPost.created_at.desc())
        .limit(6)
    ).all()
    return [
        {
            "id": b.id,
            "title": b.title,
            "slug": b.slug,
            "excerpt": b.excerpt,
            "cover_image_url": b.cover_image_url,
            "read_minutes": b.read_minutes,
        }
        for b in rows
    ]


@router.get("/faqs")
def faqs(db: Session = Depends(get_db)) -> list[dict]:
    rows = db.scalars(select(FAQ).order_by(FAQ.sort_order)).all()
    return [{"id": f.id, "question": f.question, "answer": f.answer, "category": f.category}
            for f in rows]
