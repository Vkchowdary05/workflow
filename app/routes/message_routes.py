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


MESSAGE_TEMPLATES = {
    "email": [
        {"template_id": "etpl_001", "name": "Welcome Email", "subject": "Welcome to {{company}}!", "body": "Hi {{contact_name}}, welcome aboard!"},
        {"template_id": "etpl_002", "name": "Follow-up", "subject": "Checking in, {{contact_name}}", "body": "Just wanted to follow up on your recent inquiry."},
        {"template_id": "etpl_003", "name": "Re-engagement", "subject": "We miss you!", "body": "Hi {{contact_name}}, it's been a while..."},
    ],
    "sms": [
        {"template_id": "stpl_001", "name": "Welcome SMS", "body": "Hi {{contact_name}}, welcome! Reply STOP to opt out."},
        {"template_id": "stpl_002", "name": "Follow-up SMS", "body": "Hi {{contact_name}}, saw you opened our email! Ready to chat?"},
        {"template_id": "stpl_003", "name": "Reminder SMS", "body": "Reminder: {{event_name}} is coming up. Reply YES to confirm."},
    ],
    "whatsapp": [
        {"template_id": "wtpl_001", "name": "Welcome WhatsApp", "body": "Hi {{contact_name}}! Welcome to {{company}}."},
        {"template_id": "wtpl_002", "name": "Support Follow-up", "body": "Hi {{contact_name}}, how can we help you today?"},
        {"template_id": "wtpl_003", "name": "Promo Message", "body": "Hi {{contact_name}}, we have a special offer for you!"},
    ],
}

@router.get("/templates")
async def get_message_templates(channel: str = ""):
    if channel and channel in MESSAGE_TEMPLATES:
        return {"templates": MESSAGE_TEMPLATES[channel]}
    all_templates = []
    for ch, templates in MESSAGE_TEMPLATES.items():
        for t in templates:
            all_templates.append({**t, "channel": ch})
    return {"templates": all_templates}

@router.get("")
async def list_messages(channel: str = "", limit: int = 50, offset: int = 0):
    db = get_database()
    query = {}
    if channel:
        query["channel"] = channel
    cursor = db["messages"].find(query).skip(offset).limit(limit)
    messages = await cursor.to_list(length=limit)
    for m in messages:
        m["_id"] = str(m["_id"])
    return messages

