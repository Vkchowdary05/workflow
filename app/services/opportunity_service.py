"""Opportunity Service — business logic for CRM opportunity operations."""

from fastapi import HTTPException
from app.repositories import opportunity_repo


async def create_opportunity(data: dict) -> dict:
    """Create a new opportunity."""
    opportunity = await opportunity_repo.create(data)
    return _format_opportunity(opportunity)


async def get_all_opportunities() -> list[dict]:
    """Return all opportunities."""
    opportunities = await opportunity_repo.get_all()
    return [_format_opportunity(o) for o in opportunities]


async def get_opportunity_by_id(opportunity_id: str) -> dict:
    """Return an opportunity by ID or raise 404."""
    opportunity = await opportunity_repo.get_by_id(opportunity_id)
    if not opportunity:
        raise HTTPException(status_code=404, detail=f"Opportunity '{opportunity_id}' not found.")
    return _format_opportunity(opportunity)


async def move_opportunity_stage(opportunity_id: str, new_stage: str) -> dict:
    """Move an opportunity to a new pipeline stage or raise 404."""
    updated = await opportunity_repo.move_stage(opportunity_id, new_stage)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Opportunity '{opportunity_id}' not found.")
    return _format_opportunity(updated)


def _format_opportunity(opportunity: dict) -> dict:
    """Convert a raw MongoDB opportunity doc to a response-friendly dict."""
    return {
        "opportunity_id": str(opportunity["_id"]),
        "name": opportunity.get("name", ""),
        "contact_id": opportunity.get("contact_id", ""),
        "stage": opportunity.get("stage", ""),
        "created_at": opportunity["created_at"],
        "updated_at": opportunity["updated_at"],
    }
