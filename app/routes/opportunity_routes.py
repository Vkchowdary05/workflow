"""Routes for CRM Opportunity endpoints."""

from fastapi import APIRouter
from app.models.opportunity import OpportunityCreate, MoveStage
from app.services import opportunity_service

from fastapi import APIRouter, HTTPException
from app.core.database import get_database
from bson import ObjectId

router = APIRouter()

@router.delete("/{opportunity_id}")
async def delete_opportunity(opportunity_id: str):
    db = get_database()

    result = await db.opportunities.delete_one({
        "_id": ObjectId(opportunity_id)
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return {"message": "Opportunity deleted successfully"}


@router.post("", status_code=201)
async def create_opportunity(payload: OpportunityCreate):
    """Create a new opportunity."""
    data = payload.model_dump()
    return await opportunity_service.create_opportunity(data)


@router.get("")
async def list_opportunities():
    """List all opportunities."""
    return await opportunity_service.get_all_opportunities()


@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str):
    """Get a single opportunity by ID."""
    return await opportunity_service.get_opportunity_by_id(opportunity_id)


@router.put("/{opportunity_id}/move")
async def move_opportunity(opportunity_id: str, payload: MoveStage):
    """Move an opportunity to a different pipeline stage."""
    return await opportunity_service.move_opportunity_stage(opportunity_id, payload.stage)
