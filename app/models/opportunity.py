"""Pydantic models for CRM Opportunity entities."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class OpportunityCreate(BaseModel):
    """Payload for creating a new opportunity."""
    name: str = Field(..., min_length=1)
    contact_id: str = Field(..., min_length=1)
    stage: str = Field(default="new", description="Pipeline stage, e.g. new, qualified, cold, won")


class OpportunityUpdate(BaseModel):
    """Payload for updating an existing opportunity."""
    name: Optional[str] = None
    contact_id: Optional[str] = None
    stage: Optional[str] = None


class MoveStage(BaseModel):
    """Payload for moving an opportunity to a different pipeline stage."""
    stage: str = Field(..., min_length=1, description="Target stage to move to")


class OpportunityResponse(BaseModel):
    """Shape returned to the client."""
    opportunity_id: str
    name: str
    contact_id: str
    stage: str
    created_at: datetime
    updated_at: datetime
