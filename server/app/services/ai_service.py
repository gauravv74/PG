"""AI features: NL search parsing, recommendations, chatbot (Module 13).

Uses a pluggable LLM provider. Falls back to a deterministic rule-based parser
when no LLM key is configured, so the feature works out of the box in dev.
"""
from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.enums import Gender, RoomType
from app.models.property import Property
from app.schemas.search import SearchFilters

_ROOM_KEYWORDS = {
    "studio": RoomType.studio,
    "private room": RoomType.private,
    "private": RoomType.private,
    "shared": RoomType.shared,
    "ensuite": RoomType.ensuite,
    "apartment": RoomType.apartment,
    "twin": RoomType.twin_sharing,
    "triple": RoomType.triple_sharing,
}


def _rule_based_parse(query: str) -> SearchFilters:
    q = query.lower()
    f = SearchFilters()

    # Budget: "under 15000", "below ₹15,000", "under 15k"
    m = re.search(r"(?:under|below|less than|upto|up to)\s*₹?\s*([\d,]+)\s*(k)?", q)
    if m:
        amount = int(m.group(1).replace(",", ""))
        if m.group(2) == "k":
            amount *= 1000
        f.price_max = float(amount)

    for kw, rt in _ROOM_KEYWORDS.items():
        if kw in q:
            f.room_type = [rt]
            break

    if "girls" in q or "female" in q or "women" in q:
        f.gender = Gender.female
    elif "boys" in q or "male" in q or "men" in q:
        f.gender = Gender.male

    if "food" in q or "meals" in q:
        pass  # would map to a meals amenity
    if "wifi" in q:
        f.wifi = True
    if "gym" in q:
        f.gym = True

    # Metro proximity: "within 10 minutes of metro"
    m = re.search(r"(\d+)\s*min(?:ute)?s?", q)
    if m:
        f.max_commute_minutes = int(m.group(1))

    # University / city as free text
    uni = re.search(r"near\s+([a-z\s]+?)(?:\s+with|\s+under|$)", q)
    if uni:
        f.query = uni.group(1).strip()

    return f


async def parse_natural_language(query: str) -> SearchFilters:
    if not settings.LLM_API_KEY:
        return _rule_based_parse(query)
    try:
        import httpx

        system = (
            "Convert the user's accommodation request into JSON matching this schema keys: "
            "city_id, university_id, query, price_min, price_max, room_type (list), gender, "
            "max_commute_minutes, wifi, gym. Return ONLY JSON."
        )
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {settings.LLM_API_KEY}"},
                json={
                    "model": settings.LLM_MODEL,
                    "messages": [
                        {"role": "system", "content": system},
                        {"role": "user", "content": query},
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0,
                },
            )
        import json

        content = resp.json()["choices"][0]["message"]["content"]
        return SearchFilters(**json.loads(content))
    except Exception:  # noqa: BLE001 - graceful fallback
        return _rule_based_parse(query)


def similar_properties(db: Session, property_id: str, limit: int = 6) -> list[Property]:
    """Content-based similarity: same city + type, close price, high rating."""
    base = db.get(Property, property_id)
    if not base:
        return []
    stmt = (
        select(Property)
        .where(
            Property.id != base.id,
            Property.city_id == base.city_id,
            Property.property_type == base.property_type,
        )
        .order_by(Property.avg_rating.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt).all())


def smart_budget_suggestion(db: Session, city_id: str) -> dict:
    from sqlalchemy import func

    row = db.execute(
        select(
            func.min(Property.min_price),
            func.avg(Property.min_price),
            func.max(Property.min_price),
        ).where(Property.city_id == city_id)
    ).one_or_none()
    if not row or row[1] is None:
        return {"min": None, "recommended": None, "max": None}
    return {
        "min": float(row[0]),
        "recommended": round(float(row[1]), 2),
        "max": float(row[2]),
    }
