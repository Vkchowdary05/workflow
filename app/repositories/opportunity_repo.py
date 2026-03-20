"""Repository for Opportunity collection — all database operations."""

from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database


COLLECTION = "opportunities"


def _collection():
    return get_database()[COLLECTION]


async def create(opportunity_data: dict) -> dict:
    """Insert a new opportunity document."""
    now = datetime.now(timezone.utc)
    opportunity_data["created_at"] = now
    opportunity_data["updated_at"] = now
    result = await _collection().insert_one(opportunity_data)
    opportunity_data["_id"] = result.inserted_id
    return opportunity_data


async def get_all() -> list[dict]:
    """Return all opportunities."""
    cursor = _collection().find()
    return await cursor.to_list(length=1000)


async def get_by_id(opportunity_id: str) -> dict | None:
    """Return a single opportunity by ObjectId string."""
    if not ObjectId.is_valid(opportunity_id):
        return None
    return await _collection().find_one({"_id": ObjectId(opportunity_id)})


async def move_stage(opportunity_id: str, new_stage: str) -> dict | None:
    """Move an opportunity to a different pipeline stage."""
    if not ObjectId.is_valid(opportunity_id):
        return None
    result = await _collection().find_one_and_update(
        {"_id": ObjectId(opportunity_id)},
        {
            "$set": {
                "stage": new_stage,
                "updated_at": datetime.now(timezone.utc),
            }
        },
        return_document=True,
    )
    return result
