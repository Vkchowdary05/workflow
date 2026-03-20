"""Routes for Workflow Execution endpoints."""

from fastapi import APIRouter, HTTPException
from bson import ObjectId

from app.services import workflow_service
from app.services.execution_service import execute_workflow
from app.repositories import execution_repo

router = APIRouter()


@router.post("/{workflow_id}/execute", status_code=201)
async def trigger_execution(workflow_id: str):
    """Execute a workflow by its ID. Returns the execution record."""
    workflow = await workflow_service.get_workflow_raw(workflow_id)
    result = await execute_workflow(workflow)
    return result


@router.get("/{workflow_id}/executions")
async def list_executions(workflow_id: str):
    """List all executions for a given workflow."""
    # Verify workflow exists
    await workflow_service.get_workflow_by_id(workflow_id)
    executions = await execution_repo.get_by_workflow(workflow_id)
    return [
        {
            "execution_id": str(e["_id"]),
            "workflow_id": e["workflow_id"],
            "status": e["status"],
            "step_logs": e.get("step_logs", []),
            "created_at": e["created_at"],
            "updated_at": e["updated_at"],
        }
        for e in executions
    ]


@router.get("/{workflow_id}/executions/{execution_id}")
async def get_execution(workflow_id: str, execution_id: str):
    """Get a specific execution record."""
    # Verify workflow exists
    await workflow_service.get_workflow_by_id(workflow_id)

    execution = await execution_repo.get_by_id(execution_id)
    if not execution:
        raise HTTPException(
            status_code=404,
            detail=f"Execution '{execution_id}' not found.",
        )

    # Verify it belongs to this workflow
    if execution.get("workflow_id") != workflow_id:
        raise HTTPException(
            status_code=404,
            detail=f"Execution '{execution_id}' does not belong to workflow '{workflow_id}'.",
        )

    return {
        "execution_id": str(execution["_id"]),
        "workflow_id": execution["workflow_id"],
        "status": execution["status"],
        "step_logs": execution.get("step_logs", []),
        "created_at": execution["created_at"],
        "updated_at": execution["updated_at"],
    }
