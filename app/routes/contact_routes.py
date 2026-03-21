"""Routes for Contact CRUD endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel as PBM
from typing import List
from app.models.contact import ContactCreate, ContactUpdate, TagsAdd
from app.services import contact_service

router = APIRouter()


class BulkCreate(PBM):
    contacts: List[ContactCreate]


@router.post("/bulk", status_code=201)
async def bulk_create(payload: BulkCreate):
    """Create multiple contacts at once."""
    created = 0
    for c in payload.contacts:
        await contact_service.create_contact(c.model_dump())
        created += 1
    return {"created": created}


@router.post("", status_code=201)
async def create_contact(payload: ContactCreate):
    """Create a new contact."""
    data = payload.model_dump()
    return await contact_service.create_contact(data)


@router.get("")
async def list_contacts():
    """List all contacts."""
    return await contact_service.get_all_contacts()


@router.get("/{contact_id}")
async def get_contact(contact_id: str):
    """Get a single contact by ID."""
    return await contact_service.get_contact_by_id(contact_id)


@router.put("/{contact_id}")
async def update_contact(contact_id: str, payload: ContactUpdate):
    """Update a contact."""
    data = payload.model_dump(exclude_none=True)
    return await contact_service.update_contact(contact_id, data)


@router.delete("/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact."""
    return await contact_service.delete_contact(contact_id)


@router.post("/{contact_id}/tags")
async def add_tags(contact_id: str, payload: TagsAdd):
    """Add tags to a contact."""
    return await contact_service.add_tags_to_contact(contact_id, payload.tags)

