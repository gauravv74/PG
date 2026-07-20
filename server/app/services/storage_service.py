"""Cloudinary media storage with server-side image validation (Modules 3, 15, 16)."""
from __future__ import annotations

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_DOC_TYPES = {"application/pdf"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_DOC_BYTES = 15 * 1024 * 1024

_configured = False


def _configure() -> None:
    global _configured
    if _configured:
        return
    import cloudinary

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )
    _configured = True


async def _validate(file: UploadFile, allowed: set[str], max_bytes: int) -> bytes:
    if file.content_type not in allowed:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Unsupported file type")
    data = await file.read()
    if len(data) > max_bytes:
        raise HTTPException(status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, "File too large")
    return data


async def upload_image(file: UploadFile, folder: str = "properties") -> str:
    data = await _validate(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES)
    _configure()
    import cloudinary.uploader

    result = cloudinary.uploader.upload(
        data,
        folder=f"uninest/{folder}",
        resource_type="image",
        transformation=[{"quality": "auto", "fetch_format": "auto"}],
    )
    return result["secure_url"]


async def upload_document(file: UploadFile, folder: str = "documents") -> str:
    data = await _validate(file, ALLOWED_DOC_TYPES, MAX_DOC_BYTES)
    _configure()
    import cloudinary.uploader

    result = cloudinary.uploader.upload(
        data, folder=f"uninest/{folder}", resource_type="raw"
    )
    return result["secure_url"]


def cdn_url(public_url: str, width: int | None = None) -> str:
    """Return a responsive CDN transformation URL (f_auto,q_auto)."""
    if not public_url or "/upload/" not in public_url:
        return public_url
    transform = "f_auto,q_auto"
    if width:
        transform += f",w_{width}"
    return public_url.replace("/upload/", f"/upload/{transform}/")
