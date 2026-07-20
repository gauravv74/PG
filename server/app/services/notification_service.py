"""Multi-channel notification dispatch (Module 14). Heavy sends run via Celery."""
from __future__ import annotations

import smtplib
from email.mime.text import MIMEText

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.engagement import Notification
from app.models.enums import NotificationChannel


def record_in_app(
    db: Session, user_id: str, title: str, body: str, data: dict | None = None
) -> None:
    db.add(
        Notification(
            user_id=user_id,
            channel=NotificationChannel.in_app,
            title=title,
            body=body,
            data=data or {},
        )
    )
    db.commit()


def send_email(to: str, subject: str, html: str) -> bool:
    if not settings.SMTP_HOST or not settings.SMTP_PASSWORD:
        return False
    msg = MIMEText(html, "html")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, [to], msg.as_string())
    return True


def send_sms(to: str, body: str) -> bool:
    return _twilio_send(to, body, settings.TWILIO_SMS_FROM)


def send_whatsapp(to: str, body: str) -> bool:
    return _twilio_send(f"whatsapp:{to}", body, settings.TWILIO_WHATSAPP_FROM)


def _twilio_send(to: str, body: str, from_: str) -> bool:
    if not settings.TWILIO_ACCOUNT_SID or not from_:
        return False
    try:
        import httpx

        url = (
            f"https://api.twilio.com/2010-04-01/Accounts/"
            f"{settings.TWILIO_ACCOUNT_SID}/Messages.json"
        )
        resp = httpx.post(
            url,
            data={"To": to, "From": from_, "Body": body},
            auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN),
            timeout=15,
        )
        return resp.status_code < 400
    except Exception:  # noqa: BLE001
        return False


def send_push(subscription: dict, title: str, body: str) -> bool:
    if not settings.VAPID_PRIVATE_KEY:
        return False
    try:
        import json

        from pywebpush import webpush  # type: ignore

        webpush(
            subscription_info=subscription,
            data=json.dumps({"title": title, "body": body}),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={"sub": settings.VAPID_SUBJECT},
        )
        return True
    except Exception:  # noqa: BLE001
        return False
