"""Workflow Service — business logic for workflow CRUD."""

from fastapi import HTTPException
from app.repositories import workflow_repo
from app.services.validation_service import validate_workflow


async def create_workflow(data: dict) -> dict:
    """Validate and create a new workflow."""
    validate_workflow(data["trigger"], data["steps"])
    workflow = await workflow_repo.create(data)
    return _format_workflow(workflow)


async def get_all_workflows() -> list[dict]:
    """Return all workflows."""
    workflows = await workflow_repo.get_all()
    return [_format_workflow(w) for w in workflows]


async def get_workflow_by_id(workflow_id: str) -> dict:
    """Return a workflow by ID or raise 404."""
    workflow = await workflow_repo.get_by_id(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")
    return _format_workflow(workflow)


async def get_workflow_raw(workflow_id: str) -> dict:
    """Return the raw MongoDB document for internal use (e.g. execution engine)."""
    workflow = await workflow_repo.get_by_id(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")
    return workflow


async def update_workflow(workflow_id: str, update_data: dict) -> dict:
    """Validate (if steps/trigger changed) and update the workflow."""
    # First ensure the workflow exists
    existing = await workflow_repo.get_by_id(workflow_id)
    if not existing:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")

    # If steps or trigger are being updated, re-validate
    trigger = update_data.get("trigger") or existing.get("trigger")
    steps = update_data.get("steps") or existing.get("steps")

    # Convert Pydantic models to dicts for validation if needed
    if isinstance(trigger, dict):
        trigger_dict = trigger
    else:
        trigger_dict = trigger

    if steps and len(steps) > 0 and isinstance(steps[0], dict):
        steps_dicts = steps
    else:
        steps_dicts = steps

    validate_workflow(trigger_dict, steps_dicts)

    # Remove None values from update
    clean_update = {k: v for k, v in update_data.items() if v is not None}
    if not clean_update:
        raise HTTPException(status_code=400, detail="No fields to update.")

    updated = await workflow_repo.update(workflow_id, clean_update)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")
    return _format_workflow(updated)


async def delete_workflow(workflow_id: str) -> dict:
    """Delete a workflow or raise 404."""
    deleted = await workflow_repo.delete(workflow_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Workflow '{workflow_id}' not found.")
    return {"message": f"Workflow '{workflow_id}' deleted successfully."}


def _format_workflow(workflow: dict) -> dict:
    """Convert a raw MongoDB workflow doc to a response-friendly dict."""
    return {
        "workflow_id": str(workflow["_id"]),
        "name": workflow.get("name", ""),
        "description": workflow.get("description"),
        "trigger": workflow.get("trigger", {}),
        "steps": workflow.get("steps", []),
        "tags": workflow.get("tags", []),
        "settings": workflow.get("settings"),
        "created_at": workflow["created_at"],
        "updated_at": workflow["updated_at"],
    }
