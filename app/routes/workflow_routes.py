"""Routes for Workflow CRUD endpoints."""

from fastapi import APIRouter, HTTPException
from app.models.workflow import WorkflowCreate, WorkflowUpdate
from app.services import workflow_service
from app.repositories import workflow_repo

router = APIRouter()


# ── Static routes FIRST (before parameterized /{id} routes) ──────────

@router.post("/import", status_code=201)
async def import_workflow(payload: dict):
    """
    Accepts the full Quantixone JSON export format OR a flat workflow dict.
    Extracts name, description, tags, trigger, steps, settings.
    Runs DAG validation. Saves with status=inactive.
    Returns { workflow_id, name, imported: true }
    """
    if "workflow" in payload and isinstance(payload.get("workflow"), dict):
        wf = payload["workflow"]
        meta = wf.get("meta", {})
        data = {
            "name": meta.get("name") or "Imported Workflow",
            "description": meta.get("description", ""),
            "tags": meta.get("tags", []),
            "trigger": wf.get("trigger"),
            "steps": wf.get("steps", []),
            "settings": wf.get("settings", {}),
            "status": "inactive",
        }
    else:
        data = {
            "name": payload.get("name") or "Imported Workflow",
            "description": payload.get("description", ""),
            "tags": payload.get("tags", []),
            "trigger": payload.get("trigger"),
            "steps": payload.get("steps", []),
            "settings": payload.get("settings", {}),
            "status": "inactive",
        }
    result = await workflow_service.create_workflow(data)
    return {**result, "imported": True}


@router.post("", status_code=201)
async def create_workflow(payload: WorkflowCreate):
    """Create a new workflow. Validates the DAG before saving."""
    data = payload.model_dump()
    # Convert step and trigger Pydantic models to dicts
    data["trigger"] = payload.trigger.model_dump()
    data["steps"] = [step.model_dump() for step in payload.steps]
    return await workflow_service.create_workflow(data)


@router.get("")
async def list_workflows():
    """List all workflows."""
    return await workflow_service.get_all_workflows()


# ── Parameterized routes AFTER static ones ────────────────────────────

@router.get("/{workflow_id}")
async def get_workflow(workflow_id: str):
    """Get a single workflow by ID."""
    return await workflow_service.get_workflow_by_id(workflow_id)


@router.put("/{workflow_id}")
async def update_workflow(workflow_id: str, payload: WorkflowUpdate):
    """Update a workflow. Re-validates the DAG if steps or trigger change."""
    data = payload.model_dump(exclude_none=True)
    if "trigger" in data and payload.trigger:
        data["trigger"] = payload.trigger.model_dump()
    if "steps" in data and payload.steps:
        data["steps"] = [step.model_dump() for step in payload.steps]
    return await workflow_service.update_workflow(workflow_id, data)


@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str):
    """Delete a workflow."""
    return await workflow_service.delete_workflow(workflow_id)


@router.post("/{workflow_id}/activate")
async def activate_workflow(workflow_id: str):
    """Set a workflow's status to active."""
    updated = await workflow_repo.update(workflow_id, {"status": "active"})
    if not updated:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"workflow_id": workflow_id, "status": "active"}


@router.post("/{workflow_id}/deactivate")
async def deactivate_workflow(workflow_id: str):
    """Set a workflow's status to inactive."""
    updated = await workflow_repo.update(workflow_id, {"status": "inactive"})
    if not updated:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"workflow_id": workflow_id, "status": "inactive"}
