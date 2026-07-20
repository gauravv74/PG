"""Redis token-bucket rate limiting middleware (Module 15)."""
from __future__ import annotations

import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import settings
from app.core.redis import get_redis


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit_per_minute: int | None = None):
        super().__init__(app)
        self.limit = limit_per_minute or settings.RATE_LIMIT_PER_MINUTE

    async def dispatch(self, request: Request, call_next):
        # Identify caller: authenticated user id if present, else client IP.
        client = request.headers.get("x-forwarded-for") or (
            request.client.host if request.client else "anon"
        )
        window = int(time.time() // 60)
        key = f"ratelimit:{client}:{window}"
        try:
            redis = get_redis()
            count = await redis.incr(key)
            if count == 1:
                await redis.expire(key, 60)
            if count > self.limit:
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Rate limit exceeded. Try again shortly."},
                    headers={"Retry-After": "60"},
                )
        except Exception:  # noqa: BLE001 - never fail requests if Redis is down
            pass
        return await call_next(request)
