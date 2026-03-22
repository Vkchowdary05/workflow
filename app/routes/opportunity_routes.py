"""Routes for CRM Opportunity endpoints."""

from fastapi import APIRouter, HTTPException
from app.models.opportunity import OpportunityCreate, MoveStage
from app.services import opportunity_service
from app.repositories import opportunity_repo
from app.core.database import get_database
from bson import ObjectId

router = APIRouter()


# ── Static routes FIRST (before parameterized /{id} routes) ──────────

@router.get("/pipelines")
async def get_pipelines():
    """Return available pipeline definitions with their stages."""
    return {
        "pipelines": [
            {
                "id": "default",
                "name": "Sales Pipeline",
                "stages": [
                    {"id": "new", "label": "New", "order": 1},
                    {"id": "qualified", "label": "Qualified", "order": 2},
                    {"id": "proposal", "label": "Proposal", "order": 3},
                    {"id": "cold", "label": "Cold", "order": 4},
                    {"id": "won", "label": "Won", "order": 5},
                    {"id": "lost", "label": "Lost", "order": 6},
                ],
            }
        ]
    }


@router.get("/stages")
async def get_stages():
    return {"stages": [
        {"id": "new", "label": "New", "order": 1},
        {"id": "qualified", "label": "Qualified", "order": 2},
        {"id": "proposal", "label": "Proposal", "order": 3},
        {"id": "cold", "label": "Cold", "order": 4},
        {"id": "won", "label": "Won", "order": 5},
        {"id": "lost", "label": "Lost", "order": 6},
    ]}



@router.post("", status_code=201)
async def create_opportunity(payload: OpportunityCreate):
    """Create a new opportunity."""
    data = payload.model_dump()
    return await opportunity_service.create_opportunity(data)


@router.get("")
async def list_opportunities():
    """List all opportunities."""
    return await opportunity_service.get_all_opportunities()


# ── Parameterized routes AFTER static ones ────────────────────────────

@router.get("/{opportunity_id}")
async def get_opportunity(opportunity_id: str):
    """Get a single opportunity by ID."""
    return await opportunity_service.get_opportunity_by_id(opportunity_id)


@router.put("/{opportunity_id}/move")
async def move_opportunity(opportunity_id: str, payload: MoveStage):
    """Move an opportunity to a different pipeline stage."""
    return await opportunity_service.move_opportunity_stage(opportunity_id, payload.stage)


@router.put("/{opportunity_id}")
async def update_opportunity(opportunity_id: str, payload: dict):
    """Update opportunity fields."""
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    updated = await opportunity_repo.update(opportunity_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return opportunity_service._format_opportunity(updated)


@router.delete("/{opportunity_id}")
async def delete_opportunity(opportunity_id: str):
    """Delete an opportunity."""
    db = get_database()
    result = await db.opportunities.delete_one({"_id": ObjectId(opportunity_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Opportunity not found")
    return {"message": "Opportunity deleted successfully"}
