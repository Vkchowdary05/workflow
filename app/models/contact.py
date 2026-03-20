"""Pydantic models for Contact entities."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class ContactCreate(BaseModel):
    """Payload for creating a new contact."""
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    phone: Optional[str] = None
    tags: list[str] = []


class ContactUpdate(BaseModel):
    """Payload for updating an existing contact."""
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    tags: Optional[list[str]] = None


class ContactResponse(BaseModel):
    """Shape returned to the client."""
    contact_id: str
    name: str
    email: str
    phone: Optional[str] = None
    tags: list[str] = []
    created_at: datetime
    updated_at: datetime


class TagsAdd(BaseModel):
    """Payload for adding tags to a contact."""
    tags: list[str] = Field(..., min_length=1, description="List of tags to add")
