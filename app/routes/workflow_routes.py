"""Routes for Workflow CRUD endpoints."""

from fastapi import APIRouter
from app.models.workflow import WorkflowCreate, WorkflowUpdate
from app.services import workflow_service

router = APIRouter()


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
