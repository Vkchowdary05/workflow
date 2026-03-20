"""
MongoDB connection module.
Uses Motor (async driver) to connect to MongoDB Atlas.
Connection string is read from the MONGODB_URL environment variable.
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv

load_dotenv()

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None

DATABASE_NAME = "workflow_automation"


async def connect_to_database() -> None:
    """Establish connection to MongoDB Atlas."""
    global _client, _database

    mongodb_url = os.getenv("MONGODB_URL")
    if not mongodb_url:
        raise RuntimeError(
            "MONGODB_URL environment variable is not set. "
            "Please set it to your MongoDB Atlas connection string."
        )

    _client = AsyncIOMotorClient(mongodb_url)
    _database = _client[DATABASE_NAME]

    # Verify the connection by pinging the server
    await _client.admin.command("ping")
    print("✅ Connected to MongoDB Atlas successfully!")


async def close_database_connection() -> None:
    """Close the MongoDB connection."""
    global _client, _database
    if _client:
        _client.close()
        _client = None
        _database = None
        print("🔌 MongoDB connection closed.")


def get_database() -> AsyncIOMotorDatabase:
    """Return the database instance. Must be called after connect_to_database()."""
    if _database is None:
        raise RuntimeError("Database is not connected. Call connect_to_database() first.")
    return _database
