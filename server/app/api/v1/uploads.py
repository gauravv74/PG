"""Media/document uploads to Cloudinary (Modules 3, 11, 15)."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile

from app.core.deps import get_current_user
from app.models.user import User
from app.services import storage_service

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    folder: str = "properties",
    user: User = Depends(get_current_user),
) -> dict:
    url = await storage_service.upload_image(file, folder)
    return {"url": url}


@router.post("/document")
async def upload_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
) -> dict:
    url = await storage_service.upload_document(file)
    return {"url": url}
