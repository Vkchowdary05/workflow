"""Repository for Execution collection — all database operations."""

from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database


COLLECTION = "executions"


def _collection():
    return get_database()[COLLECTION]


async def create(execution_data: dict) -> dict:
    """Insert a new execution record."""
    now = datetime.now(timezone.utc)
    execution_data["created_at"] = now
    execution_data["updated_at"] = now
    result = await _collection().insert_one(execution_data)
    execution_data["_id"] = result.inserted_id
    return execution_data


async def get_by_workflow(workflow_id: str) -> list[dict]:
    """Return all executions for a given workflow_id."""
    cursor = _collection().find({"workflow_id": workflow_id})
    return await cursor.to_list(length=1000)


async def get_by_id(execution_id: str) -> dict | None:
    """Return a single execution by its ObjectId string."""
    if not ObjectId.is_valid(execution_id):
        return None
    return await _collection().find_one({"_id": ObjectId(execution_id)})


async def update(execution_id: str, update_data: dict) -> dict | None:
    """Update an execution record."""
    if not ObjectId.is_valid(execution_id):
        return None
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = await _collection().find_one_and_update(
        {"_id": ObjectId(execution_id)},
        {"$set": update_data},
        return_document=True,
    )
    return result
