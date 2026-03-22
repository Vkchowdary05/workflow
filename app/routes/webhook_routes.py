from fastapi import APIRouter
from app.services.webhook_service import find_workflows_for_trigger, dispatch_executions

router = APIRouter()

@router.post("/{trigger_type}", status_code=200)
async def receive_webhook(trigger_type: str, event_data: dict = {}):
    workflows = await find_workflows_for_trigger(trigger_type)
    triggered = await dispatch_executions(workflows, event_data)
    return {"received": True, "trigger_type": trigger_type, "workflows_triggered": triggered}
