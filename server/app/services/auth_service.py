"""Authentication business logic (Module 15, auth flow)."""
from __future__ import annotations

import secrets
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.redis import get_redis
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import RegisterRequest, TokenResponse


def _issue_tokens(user: User) -> TokenResponse:
    access = create_access_token(user.id, user.role.value)
    refresh, _jti = create_refresh_token(user.id, user.role.value)
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


def register(db: Session, data: RegisterRequest) -> TokenResponse:
    existing = db.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(
        email=data.email,
        full_name=data.full_name,
        phone=data.phone,
        role=data.role,
        hashed_password=hash_password(data.password),
        referral_code=secrets.token_urlsafe(6)[:8],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_tokens(user)


def login(db: Session, email: str, password: str) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == email))
    if not user or not user.hashed_password or not verify_password(password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid credentials")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account disabled")
    user.last_login_at = datetime.now(UTC)
    db.commit()
    return _issue_tokens(user)


async def refresh_tokens(db: Session, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, str(exc)) from exc
    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")

    redis = get_redis()
    if await redis.get(f"revoked_jti:{payload.get('jti')}"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token revoked")

    user = db.get(User, payload.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")

    # Rotation: revoke the used refresh token.
    await redis.setex(
        f"revoked_jti:{payload.get('jti')}", settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400, "1"
    )
    return _issue_tokens(user)


async def logout(refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token)
    except ValueError:
        return
    redis = get_redis()
    await redis.setex(
        f"revoked_jti:{payload.get('jti')}", settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400, "1"
    )


def google_login(db: Session, id_token_str: str) -> TokenResponse:
    """Verify Google id_token and upsert the user."""
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        info = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid Google token") from exc

    email = info.get("email")
    if not email:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google token missing email")

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(
            email=email,
            full_name=info.get("name", email.split("@")[0]),
            avatar_url=info.get("picture"),
            google_id=info.get("sub"),
            is_email_verified=True,
            referral_code=secrets.token_urlsafe(6)[:8],
        )
        db.add(user)
    else:
        user.google_id = user.google_id or info.get("sub")
        user.is_email_verified = True
    db.commit()
    db.refresh(user)
    return _issue_tokens(user)
