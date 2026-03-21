"""Routes for Message endpoints — SMS, Email, WhatsApp."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from app.core.database import get_database
import uuid
import logging

router = APIRouter()
logger = logging.getLogger("messages")


class SmsRequest(BaseModel):
    to: str
    body: str
    contact_id: Optional[str] = None
    template_id: Optional[str] = None


class EmailRequest(BaseModel):
    to: str
    subject: str
    body: Optional[str] = None
    contact_id: Optional[str] = None
    template_id: Optional[str] = None


class WhatsappRequest(BaseModel):
    to: str
    body: str
    contact_id: Optional[str] = None
    template_id: Optional[str] = None


async def _persist(channel: str, data: dict) -> dict:
    """Save a message record to the messages collection."""
    db = get_database()
    msg = {
        "message_id": str(uuid.uuid4()),
        "channel": channel,
        "status": "sent",
        "sent_at": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc),
        **{k: v for k, v in data.items() if v is not None},
    }
    await db["messages"].insert_one(msg)
    msg["_id"] = str(msg["_id"])
    return msg


@router.post("/sms", status_code=201)
async def send_sms(p: SmsRequest):
    """Simulate sending an SMS and persist the message."""
    logger.info(f"SMS → {p.to}: {p.body[:60]}")
    msg = await _persist("sms", p.model_dump())
    return {"message_id": msg["message_id"], "status": "sent", "channel": "sms"}


@router.post("/email", status_code=201)
async def send_email(p: EmailRequest):
    """Simulate sending an email and persist the message."""
    logger.info(f"Email → {p.to}: {p.subject}")
    msg = await _persist("email", p.model_dump())
    return {"message_id": msg["message_id"], "status": "sent", "channel": "email"}


@router.post("/whatsapp", status_code=201)
async def send_whatsapp(p: WhatsappRequest):
    """Simulate sending a WhatsApp message and persist the message."""
    logger.info(f"WhatsApp → {p.to}: {p.body[:60]}")
    msg = await _persist("whatsapp", p.model_dump())
    return {"message_id": msg["message_id"], "status": "sent", "channel": "whatsapp"}


@router.get("/{message_id}")
async def get_message(message_id: str):
    """Retrieve a sent message by its ID."""
    db = get_database()
    msg = await db["messages"].find_one({"message_id": message_id})
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
    msg["_id"] = str(msg["_id"])
    return msg
