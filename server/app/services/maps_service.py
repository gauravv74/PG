"""Google Maps helpers: distance, commute times, geocoding (Module 12)."""
from __future__ import annotations

import math

import httpx

from app.core.config import settings

DISTANCE_MATRIX_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"
GEOCODE_URL = "https://maps.googleapis.com/maps/api/geocode/json"


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return round(2 * r * math.asin(math.sqrt(a)), 2)


async def commute_times(origin: tuple[float, float], dest: tuple[float, float]) -> dict:
    """Return walking/driving/transit minutes. Falls back to estimates without an API key."""
    if not settings.GOOGLE_MAPS_API_KEY:
        km = haversine_km(*origin, *dest)
        return {
            "distance_km": km,
            "walking_minutes": round(km / 5 * 60),
            "driving_minutes": round(km / 30 * 60),
            "transit_minutes": round(km / 20 * 60),
        }
    result: dict = {"distance_km": haversine_km(*origin, *dest)}
    async with httpx.AsyncClient(timeout=10) as client:
        for mode, key in (("walking", "walking_minutes"), ("driving", "driving_minutes"),
                          ("transit", "transit_minutes")):
            resp = await client.get(
                DISTANCE_MATRIX_URL,
                params={
                    "origins": f"{origin[0]},{origin[1]}",
                    "destinations": f"{dest[0]},{dest[1]}",
                    "mode": mode,
                    "key": settings.GOOGLE_MAPS_API_KEY,
                },
            )
            data = resp.json()
            try:
                secs = data["rows"][0]["elements"][0]["duration"]["value"]
                result[key] = round(secs / 60)
            except (KeyError, IndexError):
                result[key] = None
    return result
