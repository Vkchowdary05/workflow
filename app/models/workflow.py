"""Pydantic models for Workflow entities."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


# ── Sub-models ──

class Trigger(BaseModel):
    """Trigger definition — the starting point of a workflow."""
    type: str = Field(..., description="Trigger type, e.g. 'contact_created'")
    label: Optional[str] = None
    config: Optional[dict] = None


class Step(BaseModel):
    """A single step (node) in the workflow DAG."""
    id: str = Field(..., description="Unique step identifier")
    type: str = Field(..., description="Step type: action | delay | condition")
    action_type: Optional[str] = Field(None, description="e.g. send_email, send_sms, move_pipeline")
    label: Optional[str] = None
    config: Optional[dict] = None
    on_success: Optional[str] = Field(None, description="Step ID to go to on success")
    on_failure: Optional[str] = Field(None, description="Step ID to go to on failure")
    on_complete: Optional[str] = Field(None, description="Step ID after delay completes")
    branches: Optional[dict] = Field(None, description="Condition branches: {'true': step_id, 'false': step_id}")
    retry_policy: Optional[dict] = None
    position: Optional[dict] = None


# ── Request / Response ──

class WorkflowCreate(BaseModel):
    """Payload for creating a new workflow."""
    name: str = Field(..., min_length=1, description="Workflow name")
    description: Optional[str] = None
    trigger: Trigger
    steps: list[Step]
    tags: Optional[list[str]] = []
    settings: Optional[dict] = None


class WorkflowUpdate(BaseModel):
    """Payload for updating an existing workflow."""
    name: Optional[str] = None
    description: Optional[str] = None
    trigger: Optional[Trigger] = None
    steps: Optional[list[Step]] = None
    tags: Optional[list[str]] = None
    settings: Optional[dict] = None


class WorkflowResponse(BaseModel):
    """Shape returned to the client."""
    workflow_id: str
    name: str
    description: Optional[str] = None
    trigger: dict
    steps: list[dict]
    tags: list[str] = []
    settings: Optional[dict] = None
    created_at: datetime
    updated_at: datetime
