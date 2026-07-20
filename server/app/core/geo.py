"""Geospatial helpers for map/bounding-box search (Module: Map Search Algorithm).

Pure-Python implementations so the app has zero extra dependencies today, while
keeping a clean seam to swap in PostGIS (ST_Within / GiST index) in the future.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

EARTH_RADIUS_KM = 6371.0088

_GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"


@dataclass(frozen=True)
class BBox:
    """A viewport / bounding box expressed as lat-lng extents."""

    north: float
    south: float
    east: float
    west: float

    @property
    def crosses_antimeridian(self) -> bool:
        # When the map is dragged across the +/-180 line the west edge is
        # numerically greater than the east edge.
        return self.west > self.east

    @property
    def center(self) -> tuple[float, float]:
        lat = (self.north + self.south) / 2
        if self.crosses_antimeridian:
            lng = ((self.west + self.east + 360) / 2) % 360
            if lng > 180:
                lng -= 360
        else:
            lng = (self.east + self.west) / 2
        return lat, lng


def haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometres between two points."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


def geohash_encode(latitude: float, longitude: float, precision: int = 9) -> str:
    """Encode a coordinate into a geohash string.

    Precision 9 ~= 4.8m x 4.8m cell — plenty for proximity bucketing and
    prefix-based clustering without any external library.
    """
    lat_range = [-90.0, 90.0]
    lng_range = [-180.0, 180.0]
    geohash: list[str] = []
    bit = 0
    ch = 0
    even = True  # start with longitude

    while len(geohash) < precision:
        if even:
            mid = (lng_range[0] + lng_range[1]) / 2
            if longitude >= mid:
                ch = (ch << 1) | 1
                lng_range[0] = mid
            else:
                ch <<= 1
                lng_range[1] = mid
        else:
            mid = (lat_range[0] + lat_range[1]) / 2
            if latitude >= mid:
                ch = (ch << 1) | 1
                lat_range[0] = mid
            else:
                ch <<= 1
                lat_range[1] = mid

        even = not even
        if bit < 4:
            bit += 1
        else:
            geohash.append(_GEOHASH_BASE32[ch])
            bit = 0
            ch = 0

    return "".join(geohash)


def bbox_from_center(lat: float, lng: float, radius_km: float) -> BBox:
    """Return a bounding box that fully contains a radius around a point.

    Used for 'nearby' search when the client sends a center + radius instead of
    explicit viewport edges.
    """
    lat_delta = radius_km / 111.045  # ~km per degree latitude
    cos_lat = max(math.cos(math.radians(lat)), 1e-6)
    lng_delta = radius_km / (111.045 * cos_lat)
    return BBox(
        north=min(lat + lat_delta, 90.0),
        south=max(lat - lat_delta, -90.0),
        east=lng + lng_delta,
        west=lng - lng_delta,
    )
