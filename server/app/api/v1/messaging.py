"""Messaging: REST + WebSocket chat with typing & read receipts (Module 9)."""
from __future__ import annotations

import json
from datetime import UTC

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.redis import get_redis
from app.core.security import decode_token
from app.db.session import SessionLocal, get_db
from app.models.messaging import Conversation, Message, conversation_participants
from app.models.user import User
from app.schemas.booking import MessageCreate, MessageOut

router = APIRouter(prefix="/messaging", tags=["messaging"])


def _get_or_create_conversation(db: Session, user: User, data: MessageCreate) -> Conversation:
    if data.conversation_id:
        convo = db.get(Conversation, data.conversation_id)
        if not convo:
            raise HTTPException(404, "Conversation not found")
        return convo
    convo = Conversation(property_id=data.property_id)
    db.add(convo)
    db.flush()
    db.execute(
        conversation_participants.insert().values(conversation_id=convo.id, user_id=user.id)
    )
    if data.recipient_id:
        db.execute(
            conversation_participants.insert().values(
                conversation_id=convo.id, user_id=data.recipient_id
            )
        )
    return convo


@router.get("/conversations")
def list_conversations(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    stmt = (
        select(Conversation)
        .join(conversation_participants)
        .where(conversation_participants.c.user_id == user.id)
        .order_by(desc(Conversation.last_message_at))
    )
    convos = db.scalars(stmt).all()
    return [{"id": c.id, "property_id": c.property_id, "last_message_at": c.last_message_at}
            for c in convos]


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(
    conversation_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> list[Message]:
    return list(
        db.scalars(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        ).all()
    )


@router.post("/messages", response_model=MessageOut, status_code=201)
async def send_message(
    data: MessageCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)
) -> Message:
    from datetime import datetime

    convo = _get_or_create_conversation(db, user, data)
    msg = Message(
        conversation_id=convo.id,
        sender_id=user.id,
        body=data.body,
        attachment_url=data.attachment_url,
        attachment_type=data.attachment_type,
    )
    db.add(msg)
    convo.last_message_at = datetime.now(UTC)
    db.commit()
    db.refresh(msg)
    # Publish to Redis so WS subscribers on any node deliver it.
    redis = get_redis()
    await redis.publish(
        f"chat:{convo.id}",
        json.dumps({"type": "message", "id": msg.id, "sender_id": user.id, "body": msg.body}),
    )
    return msg


@router.websocket("/ws/{conversation_id}")
async def chat_ws(websocket: WebSocket, conversation_id: str, token: str) -> None:
    """WebSocket for real-time chat, typing indicators, and read receipts."""
    try:
        payload = decode_token(token)
        user_id = payload["sub"]
    except Exception:  # noqa: BLE001
        await websocket.close(code=4401)
        return

    await websocket.accept()
    redis = get_redis()
    pubsub = redis.pubsub()
    await pubsub.subscribe(f"chat:{conversation_id}")

    import asyncio

    async def reader() -> None:
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"])

    reader_task = asyncio.create_task(reader())
    try:
        while True:
            raw = await websocket.receive_text()
            event = json.loads(raw)
            # Broadcast typing / read events to the room.
            if event.get("type") in ("typing", "read"):
                event["user_id"] = user_id
                await redis.publish(f"chat:{conversation_id}", json.dumps(event))
            elif event.get("type") == "message" and event.get("body"):
                db = SessionLocal()
                try:
                    msg = Message(
                        conversation_id=conversation_id, sender_id=user_id, body=event["body"]
                    )
                    db.add(msg)
                    db.commit()
                    db.refresh(msg)
                    await redis.publish(
                        f"chat:{conversation_id}",
                        json.dumps({"type": "message", "id": msg.id, "sender_id": user_id,
                                    "body": msg.body}),
                    )
                finally:
                    db.close()
    except WebSocketDisconnect:
        pass
    finally:
        reader_task.cancel()
        await pubsub.unsubscribe(f"chat:{conversation_id}")
