from fastapi import APIRouter, Query
from app.repositories import analytics_repo

router = APIRouter()

@router.get("/summary")
async def get_summary(period: str = Query(default="week")):
    return await analytics_repo.get_summary(period)

@router.get("/workflows/{workflow_id}")
async def get_workflow_metrics(workflow_id: str, period: str = Query(default="week")):
    return await analytics_repo.get_workflow_metrics(workflow_id, period)

@router.post("/events", status_code=201)
async def record_event(data: dict):
    return await analytics_repo.record_event(data)
