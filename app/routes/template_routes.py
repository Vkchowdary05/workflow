from fastapi import APIRouter, Query
from app.services import workflow_service
import uuid

router = APIRouter()

TEMPLATES = [
    {
        "template_id": "tpl_001",
        "name": "Welcome Email Sequence",
        "description": "Send a welcome email when a new contact is created, wait 2 days, then follow up.",
        "category": "marketing",
        "tags": ["email", "welcome", "nurture"],
        "trigger": {"type": "contact_created", "label": "Contact Created", "config": {}},
        "steps": [
            {"id": "step_1", "type": "action", "action_type": "send_email", "label": "Send Welcome Email",
             "config": {"to": "{{contact.email}}", "subject": "Welcome!", "template_id": None}, "on_success": "step_2", "on_failure": None},
            {"id": "step_2", "type": "delay", "label": "Wait 2 Days",
             "config": {"duration": 2, "unit": "days"}, "on_complete": "step_3"},
            {"id": "step_3", "type": "action", "action_type": "add_tag", "label": "Tag as Welcomed",
             "config": {"tags": ["welcomed"]}, "on_success": None, "on_failure": None},
        ]
    },
    {
        "template_id": "tpl_002",
        "name": "Lead Nurture (Email + SMS)",
        "description": "Email then SMS follow-up for new leads.",
        "category": "marketing",
        "tags": ["email", "sms", "lead"],
        "trigger": {"type": "contact_created", "label": "Contact Created", "config": {}},
        "steps": [
            {"id": "step_1", "type": "action", "action_type": "send_email", "label": "Send Intro Email",
             "config": {"to": "{{contact.email}}", "subject": "Hello from us!"}, "on_success": "step_2", "on_failure": None},
            {"id": "step_2", "type": "delay", "label": "Wait 1 Day",
             "config": {"duration": 1, "unit": "days"}, "on_complete": "step_3"},
            {"id": "step_3", "type": "action", "action_type": "send_sms", "label": "Send Follow-up SMS",
             "config": {"to": "{{contact.phone}}", "body": "Hi, just checking in!"}, "on_success": None, "on_failure": None},
        ]
    },
    {
        "template_id": "tpl_003",
        "name": "New Contact to Opportunity",
        "description": "Automatically create a CRM opportunity for every new contact.",
        "category": "crm",
        "tags": ["crm", "opportunity"],
        "trigger": {"type": "contact_created", "label": "Contact Created", "config": {}},
        "steps": [
            {"id": "step_1", "type": "action", "action_type": "create_opportunity", "label": "Create Opportunity",
             "config": {"name": "New Deal", "stage": "new"}, "on_success": "step_2", "on_failure": None},
            {"id": "step_2", "type": "action", "action_type": "add_tag", "label": "Tag as Prospect",
             "config": {"tags": ["prospect"]}, "on_success": None, "on_failure": None},
        ]
    },
    {
        "template_id": "tpl_004",
        "name": "Pipeline Stage Notification",
        "description": "Send SMS when an opportunity moves to Proposal stage.",
        "category": "crm",
        "tags": ["pipeline", "sms", "notification"],
        "trigger": {"type": "pipeline_stage_changed", "label": "Pipeline Stage Changed", "config": {}},
        "steps": [
            {"id": "step_1", "type": "condition", "condition_type": "if_else", "label": "Is Proposal Stage?",
             "config": {"rules": [{"field": "stage", "operator": "equals", "value": "proposal"}]},
             "branches": {"true": "step_2", "false": None}},
            {"id": "step_2", "type": "action", "action_type": "send_sms", "label": "Send Notification SMS",
             "config": {"to": "{{contact.phone}}", "body": "Your proposal is ready!"}, "on_success": None, "on_failure": None},
        ]
    },
    {
        "template_id": "tpl_005",
        "name": "Re-engagement Campaign",
        "description": "Tag cold contacts and send a re-engagement email.",
        "category": "marketing",
        "tags": ["re-engagement", "email", "cold"],
        "trigger": {"type": "contact_created", "label": "Contact Created", "config": {}},
        "steps": [
            {"id": "step_1", "type": "action", "action_type": "add_tag", "label": "Tag as Cold",
             "config": {"tags": ["cold"]}, "on_success": "step_2", "on_failure": None},
            {"id": "step_2", "type": "action", "action_type": "send_email", "label": "Send Re-engagement Email",
             "config": {"to": "{{contact.email}}", "subject": "We miss you!"}, "on_success": None, "on_failure": None},
        ]
    },
]

@router.get("")
async def list_templates(category: str = Query(default=None), limit: int = Query(default=10)):
    result = TEMPLATES
    if category:
        result = [t for t in result if t["category"] == category]
    return {"templates": result[:limit]}

@router.post("/{template_id}/clone")
async def clone_template(template_id: str, payload: dict):
    template = next((t for t in TEMPLATES if t["template_id"] == template_id), None)
    if not template:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Template not found")
    new_data = {
        "name": payload.get("new_name") or f"Copy of {template['name']}",
        "description": template["description"],
        "tags": template["tags"],
        "trigger": template["trigger"],
        "steps": template["steps"],
        "status": "inactive",
    }
    result = await workflow_service.create_workflow(new_data)
    return {"workflow_id": result["workflow_id"], "name": result["name"], "cloned": True}
