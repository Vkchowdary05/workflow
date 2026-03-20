"""Contact Service — business logic for contact operations."""

from fastapi import HTTPException
from app.repositories import contact_repo


async def create_contact(data: dict) -> dict:
    """Create a new contact."""
    contact = await contact_repo.create(data)
    return _format_contact(contact)


async def get_all_contacts() -> list[dict]:
    """Return all contacts."""
    contacts = await contact_repo.get_all()
    return [_format_contact(c) for c in contacts]


async def get_contact_by_id(contact_id: str) -> dict:
    """Return a contact by ID or raise 404."""
    contact = await contact_repo.get_by_id(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail=f"Contact '{contact_id}' not found.")
    return _format_contact(contact)


async def update_contact(contact_id: str, update_data: dict) -> dict:
    """Update a contact or raise 404."""
    clean_update = {k: v for k, v in update_data.items() if v is not None}
    if not clean_update:
        raise HTTPException(status_code=400, detail="No fields to update.")

    updated = await contact_repo.update(contact_id, clean_update)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Contact '{contact_id}' not found.")
    return _format_contact(updated)


async def delete_contact(contact_id: str) -> dict:
    """Delete a contact or raise 404."""
    deleted = await contact_repo.delete(contact_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Contact '{contact_id}' not found.")
    return {"message": f"Contact '{contact_id}' deleted successfully."}


async def add_tags_to_contact(contact_id: str, tags: list[str]) -> dict:
    """Add tags to a contact or raise 404."""
    updated = await contact_repo.add_tags(contact_id, tags)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Contact '{contact_id}' not found.")
    return _format_contact(updated)


def _format_contact(contact: dict) -> dict:
    """Convert a raw MongoDB contact doc to a response-friendly dict."""
    return {
        "contact_id": str(contact["_id"]),
        "name": contact.get("name", ""),
        "email": contact.get("email", ""),
        "phone": contact.get("phone"),
        "tags": contact.get("tags", []),
        "created_at": contact["created_at"],
        "updated_at": contact["updated_at"],
    }
