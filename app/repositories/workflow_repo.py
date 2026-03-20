"""Repository for Workflow collection — all database operations."""

from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database


COLLECTION = "workflows"


def _collection():
    return get_database()[COLLECTION]


async def create(workflow_data: dict) -> dict:
    """Insert a new workflow document and return it with its ID."""
    now = datetime.now(timezone.utc)
    workflow_data["created_at"] = now
    workflow_data["updated_at"] = now
    result = await _collection().insert_one(workflow_data)
    workflow_data["_id"] = result.inserted_id
    return workflow_data


async def get_all() -> list[dict]:
    """Return all workflow documents."""
    cursor = _collection().find()
    return await cursor.to_list(length=1000)


async def get_by_id(workflow_id: str) -> dict | None:
    """Return a single workflow by its ObjectId string, or None."""
    if not ObjectId.is_valid(workflow_id):
        return None
    return await _collection().find_one({"_id": ObjectId(workflow_id)})


async def update(workflow_id: str, update_data: dict) -> dict | None:
    """Update a workflow and return the updated document."""
    if not ObjectId.is_valid(workflow_id):
        return None
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = await _collection().find_one_and_update(
        {"_id": ObjectId(workflow_id)},
        {"$set": update_data},
        return_document=True,
    )
    return result


async def delete(workflow_id: str) -> bool:
    """Delete a workflow. Returns True if a document was actually deleted."""
    if not ObjectId.is_valid(workflow_id):
        return False
    result = await _collection().delete_one({"_id": ObjectId(workflow_id)})
    return result.deleted_count == 1
