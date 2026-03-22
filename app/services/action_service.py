"""
Action Simulation Service.

Simulates workflow actions by logging them.
For DB-related actions (move_pipeline, add_tag, update_contact),
updates are also applied to the respective MongoDB collections.
"""

import logging
from app.repositories import contact_repo, opportunity_repo

logger = logging.getLogger("workflow.actions")


async def execute_action(action_type: str, config: dict) -> dict:
    """
    Execute a simulated action based on its type.
    Returns a dict with 'status' and 'message'.
    """
    handler = _ACTION_HANDLERS.get(action_type)
    if not handler:
        return {
            "status": "failed",
            "message": f"Unknown action type: '{action_type}'",
        }
    return await handler(config)


# ── Individual action handlers ──

async def _handle_send_email(config: dict) -> dict:
    to = config.get("to") or config.get("contact_email", "unknown")
    subject = config.get("subject", "(no subject)")
    logger.info(f"📧 Email sent to {to} — Subject: {subject}")
    try:
        from app.core.database import get_database
        import uuid
        from datetime import datetime, timezone
        db = get_database()
        await db["messages"].insert_one({
            "message_id": str(uuid.uuid4()),
            "channel": "email",
            "to": to,
            "subject": subject,
            "body": config.get("body", ""),
            "status": "sent",
            "sent_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
        })
    except Exception:
        pass
    return {"status": "success", "message": f"Email sent to {to}"}


async def _handle_send_sms(config: dict) -> dict:
    to = config.get("to") or config.get("contact_phone", "unknown")
    body = config.get("body", "")
    logger.info(f"📱 SMS sent to {to} — Body: {body[:50]}")
    try:
        from app.core.database import get_database
        import uuid
        from datetime import datetime, timezone
        db = get_database()
        await db["messages"].insert_one({
            "message_id": str(uuid.uuid4()),
            "channel": "sms",
            "to": to,
            "body": body,
            "status": "sent",
            "sent_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
        })
    except Exception:
        pass
    return {"status": "success", "message": f"SMS sent to {to}"}


async def _handle_send_whatsapp(config: dict) -> dict:
    to = config.get("to") or config.get("contact_phone", "unknown")
    body = config.get("body", "")
    logger.info(f"🟢 WhatsApp sent to {to} — Body: {body[:50]}")
    try:
        from app.core.database import get_database
        import uuid
        from datetime import datetime, timezone
        db = get_database()
        await db["messages"].insert_one({
            "message_id": str(uuid.uuid4()),
            "channel": "whatsapp",
            "to": to,
            "body": body,
            "status": "sent",
            "sent_at": datetime.now(timezone.utc),
            "created_at": datetime.now(timezone.utc),
        })
    except Exception:
        pass
    return {"status": "success", "message": f"WhatsApp sent to {to}"}

async def _handle_create_opportunity(config: dict) -> dict:
    """Create an opportunity in the DB."""
    contact_id = config.get("contact_id")
    name       = config.get("name", "New Opportunity")
    stage      = config.get("stage", "new")
    logger.info(f"💼 Creating opportunity: {name} for contact: {contact_id}")
    
    if contact_id:
        try:
            opp = await opportunity_repo.create({
                "name":       name,
                "contact_id": contact_id,
                "stage":      stage,
            })
            return {"status": "success", "message": f"Opportunity '{name}' created (ID: {str(opp['_id'])})"}
        except Exception as e:
            return {"status": "failed", "message": f"Failed to create opportunity: {str(e)}"}
            
    return {"status": "success", "message": f"Opportunity '{name}' simulated (no contact_id)"}


async def _handle_move_pipeline(config: dict) -> dict:
    """Move an opportunity to a target stage in the DB."""
    target_stage = config.get("target_stage", "unknown")
    pipeline_id = config.get("pipeline_id", "")
    note = config.get("note", "")

    logger.info(
        f"🔀 Pipeline move — stage: {target_stage}, pipeline: {pipeline_id}, note: {note}"
    )

    # If an opportunity_id is provided in config, actually update the DB
    opportunity_id = config.get("opportunity_id")
    if opportunity_id:
        updated = await opportunity_repo.move_stage(opportunity_id, target_stage)
        if updated:
            return {
                "status": "success",
                "message": f"Opportunity {opportunity_id} moved to stage '{target_stage}'",
            }
        return {
            "status": "success",
            "message": f"Pipeline move simulated to stage '{target_stage}' (opportunity not found in DB)",
        }

    return {
        "status": "success",
        "message": f"Pipeline move simulated to stage '{target_stage}'",
    }


async def _handle_add_tag(config: dict) -> dict:
    """Add tags to a contact in the DB."""
    tags = config.get("tags", [])
    contact_id = config.get("contact_id")

    logger.info(f"🏷️ Tags added: {tags}")

    if contact_id and tags:
        updated = await contact_repo.add_tags(contact_id, tags)
        if updated:
            return {
                "status": "success",
                "message": f"Tags {tags} added to contact {contact_id}",
            }
        return {
            "status": "success",
            "message": f"Tags simulated: {tags} (contact not found in DB)",
        }

    return {"status": "success", "message": f"Tags simulated: {tags}"}


async def _handle_update_contact(config: dict) -> dict:
    """Update contact fields in the DB."""
    contact_id = config.get("contact_id")
    field_updates = config.get("field_updates", {})

    logger.info(f"✏️ Contact update — id: {contact_id}, fields: {field_updates}")

    if contact_id and field_updates:
        updated = await contact_repo.update(contact_id, field_updates)
        if updated:
            return {
                "status": "success",
                "message": f"Contact {contact_id} updated with {list(field_updates.keys())}",
            }
        return {
            "status": "success",
            "message": f"Contact update simulated (contact not found in DB)",
        }

    return {"status": "success", "message": "Contact update simulated"}


# ── Handler mapping ──

_ACTION_HANDLERS = {
    "send_email": _handle_send_email,
    "send_sms": _handle_send_sms,
    "send_whatsapp": _handle_send_whatsapp,
    "create_opportunity": _handle_create_opportunity,
    "move_pipeline": _handle_move_pipeline,
    "add_tag": _handle_add_tag,
    "update_contact": _handle_update_contact,
}
