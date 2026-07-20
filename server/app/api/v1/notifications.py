"""Notification center + push subscriptions (Module 14)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.engagement import Notification, PushSubscription
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


class PushSub(BaseModel):
    endpoint: str
    p256dh: str
    auth: str


@router.get("")
def list_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.scalars(
        select(Notification).where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc()).limit(50)
    ).all()
    return [
        {"id": n.id, "title": n.title, "body": n.body, "is_read": n.is_read,
         "created_at": n.created_at, "data": n.data}
        for n in rows
    ]


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> dict:
    db.execute(
        update(Notification)
        .where(Notification.id == notification_id, Notification.user_id == user.id)
        .values(is_read=True)
    )
    db.commit()
    return {"detail": "ok"}


@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db), user: User = Depends(get_current_user)) -> dict:
    db.execute(
        update(Notification).where(Notification.user_id == user.id).values(is_read=True)
    )
    db.commit()
    return {"detail": "ok"}


@router.post("/push/subscribe", status_code=201)
def subscribe_push(
    sub: PushSub, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> dict:
    db.merge(
        PushSubscription(user_id=user.id, endpoint=sub.endpoint, p256dh=sub.p256dh, auth=sub.auth)
    )
    db.commit()
    return {"detail": "subscribed"}
