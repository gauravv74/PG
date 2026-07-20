"""Aggregate all v1 routers."""
from fastapi import APIRouter

from app.api.v1 import (
    admin,
    ai,
    auth,
    bookings,
    discovery,
    host,
    messaging,
    notifications,
    properties,
    reviews,
    search,
    students,
    uploads,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(discovery.router)
api_router.include_router(search.router)
api_router.include_router(properties.router)
api_router.include_router(bookings.router)
api_router.include_router(reviews.router)
api_router.include_router(messaging.router)
api_router.include_router(notifications.router)
api_router.include_router(students.router)
api_router.include_router(host.router)
api_router.include_router(admin.router)
api_router.include_router(ai.router)
api_router.include_router(uploads.router)
