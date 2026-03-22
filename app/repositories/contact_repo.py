"""Repository for Contact collection — all database operations."""

from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database


COLLECTION = "contacts"


def _collection():
    return get_database()[COLLECTION]


async def create(contact_data: dict) -> dict:
    """Insert a new contact document."""
    now = datetime.now(timezone.utc)
    contact_data["created_at"] = now
    contact_data["updated_at"] = now
    result = await _collection().insert_one(contact_data)
    contact_data["_id"] = result.inserted_id
    return contact_data


async def get_all() -> list[dict]:
    """Return all contacts."""
    cursor = _collection().find()
    return await cursor.to_list(length=1000)


async def get_by_id(contact_id: str) -> dict | None:
    """Return a single contact by ObjectId string."""
    if not ObjectId.is_valid(contact_id):
        return None
    return await _collection().find_one({"_id": ObjectId(contact_id)})


async def update(contact_id: str, update_data: dict) -> dict | None:
    """Update a contact and return the updated document."""
    if not ObjectId.is_valid(contact_id):
        return None
    update_data["updated_at"] = datetime.now(timezone.utc)
    result = await _collection().find_one_and_update(
        {"_id": ObjectId(contact_id)},
        {"$set": update_data},
        return_document=True,
    )
    return result


async def delete(contact_id: str) -> bool:
    """Delete a contact. Returns True if deleted."""
    if not ObjectId.is_valid(contact_id):
        return False
    result = await _collection().delete_one({"_id": ObjectId(contact_id)})
    return result.deleted_count == 1


async def add_tags(contact_id: str, tags: list[str]) -> dict | None:
    """Add tags to a contact (using $addToSet to avoid duplicates)."""
    if not ObjectId.is_valid(contact_id):
        return None
    result = await _collection().find_one_and_update(
        {"_id": ObjectId(contact_id)},
        {
            "$addToSet": {"tags": {"$each": tags}},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
        return_document=True,
    )
    return result


async def search(query: str = "", tags: list = None) -> list[dict]:
    filter_dict = {}
    conditions = []
    if query:
        conditions.append({"$or": [
            {"name": {"$regex": query, "$options": "i"}},
            {"email": {"$regex": query, "$options": "i"}},
        ]})
    if tags:
        conditions.append({"tags": {"$in": tags}})
    if conditions:
        filter_dict = {"$and": conditions} if len(conditions) > 1 else conditions[0]
    cursor = _collection().find(filter_dict)
    return await cursor.to_list(length=100)

