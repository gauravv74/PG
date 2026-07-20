"""Advanced search endpoint (Module 2)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.common import Page
from app.schemas.property import PropertyCard
from app.schemas.search import SearchFilters
from app.services import search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=Page[PropertyCard])
def search_properties(
    filters: SearchFilters = Depends(), db: Session = Depends(get_db)
) -> Page[PropertyCard]:
    items, total = search_service.search(db, filters)
    return Page[PropertyCard](
        items=[PropertyCard.model_validate(p) for p in items],
        total=total,
        page=filters.page,
        page_size=filters.page_size,
        has_next=filters.page * filters.page_size < total,
    )
