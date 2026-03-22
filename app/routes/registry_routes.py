"""Routes for Registry endpoints — available triggers and actions."""

from fastapi import APIRouter

router = APIRouter()

TRIGGERS = [
    {"type": "contact_created", "label": "Contact Created", "description": "Fires when a new contact is added"},
    {"type": "pipeline_stage_changed", "label": "Pipeline Stage Changed", "description": "Fires when an opportunity changes stage"},
    {"type": "webhook", "label": "Incoming Webhook", "description": "Fires on an HTTP POST to a webhook URL"},
    {"type": "scheduled", "label": "Scheduled (Cron)", "description": "Fires on a recurring schedule"},
    {"type": "tag_added", "label": "Tag Added", "description": "Fires when a tag is applied to a contact"},
    {"type": "opportunity_created", "label": "Opportunity Created", "description": "Fires when a new CRM opportunity is created"},
]

ACTIONS = [
    {"type": "send_email", "label": "Send Email", "applies_to": ["contact"], "description": "Send an email"},
    {"type": "send_sms", "label": "Send SMS", "applies_to": ["contact"], "description": "Send an SMS"},
    {"type": "send_whatsapp", "label": "Send WhatsApp", "applies_to": ["contact"], "description": "Send a WhatsApp message"},
    {"type": "add_tag", "label": "Add Tag", "applies_to": ["contact", "opportunity"], "description": "Add tags to a contact"},
    {"type": "update_contact", "label": "Update Contact", "applies_to": ["contact", "opportunity"], "description": "Update contact fields"},
    {"type": "move_pipeline", "label": "Move Pipeline Stage", "applies_to": ["opportunity"], "description": "Move opportunity to a stage"},
    {"type": "create_opportunity", "label": "Create Opportunity", "applies_to": ["contact"], "description": "Create a new CRM opportunity"},
]


@router.get("/triggers")
async def list_triggers():
    """Return all available trigger types."""
    return {"triggers": TRIGGERS}


@router.get("/actions")
async def list_actions():
    """Return all available action types with applies_to metadata."""
    return {"actions": ACTIONS}


@router.post("/triggers/{trigger_type}/test")
async def test_trigger(trigger_type: str, payload: dict = {}):
    known = [t["type"] for t in TRIGGERS]
    if trigger_type not in known:
        return {"valid": False, "message": f"Unknown trigger type: {trigger_type}"}
    return {"valid": True, "message": f"Trigger '{trigger_type}' is valid and registered."}

@router.post("/actions/{action_type}/test")
async def test_action(action_type: str, payload: dict = {}):
    known = [a["type"] for a in ACTIONS]
    if action_type not in known:
        return {"success": False, "result": {"error": f"Unknown action: {action_type}"}}
    return {"success": True, "result": {"simulated": True, "action_type": action_type}}

