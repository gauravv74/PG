"""Celery application + Beat schedule (Modules 5, 14)."""
from __future__ import annotations

from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "uninest",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.workers.tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

celery_app.conf.beat_schedule = {
    "rent-reminders-daily": {
        "task": "app.workers.tasks.send_rent_reminders",
        "schedule": crontab(hour=9, minute=0),
    },
    "move-in-reminders-daily": {
        "task": "app.workers.tasks.send_move_in_reminders",
        "schedule": crontab(hour=10, minute=0),
    },
    "saved-search-alerts": {
        "task": "app.workers.tasks.process_saved_search_alerts",
        "schedule": crontab(hour="*/6", minute=0),
    },
}
