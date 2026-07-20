"""Auth endpoints (Module 15)."""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    GoogleLoginRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from app.schemas.common import Message
from app.services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(data: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.register(db, data)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.login(db, data.email, data.password)


@router.post("/google", response_model=TokenResponse)
def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.google_login(db, data.id_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return await auth_service.refresh_tokens(db, data.refresh_token)


@router.post("/logout", response_model=Message)
async def logout(data: RefreshRequest) -> Message:
    await auth_service.logout(data.refresh_token)
    return Message(detail="Logged out")


@router.get("/me", response_model=UserPublic)
def me(user: User = Depends(get_current_user)) -> User:
    return user
