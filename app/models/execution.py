"""Pydantic models for Workflow Execution entities."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class StepLog(BaseModel):
    """Log entry for a single step execution."""
    step_id: str
    step_type: str
    action_type: Optional[str] = None
    label: Optional[str] = None
    status: str = Field(..., description="success | failed | skipped")
    message: Optional[str] = None
    timestamp: datetime


class ExecutionResponse(BaseModel):
    """Shape returned to the client for an execution record."""
    execution_id: str
    workflow_id: str
    status: str = Field(..., description="success | failed")
    step_logs: list[StepLog] = []
    created_at: datetime
    updated_at: datetime
