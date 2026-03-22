from datetime import datetime, timezone, timedelta
from app.core.database import get_database
import uuid

COLLECTION = "analytics_daily"

def _collection():
    return get_database()[COLLECTION]

async def record_event(data: dict) -> dict:
    now = datetime.now(timezone.utc)
    event = {
        "event_id": str(uuid.uuid4()),
        "workflow_id": data.get("workflow_id"),
        "execution_id": data.get("execution_id"),
        "status": data.get("status", "unknown"),
        "duration_ms": data.get("duration_ms", 0),
        "date": now.strftime("%Y-%m-%d"),
        "created_at": now,
    }
    await _collection().insert_one(event)
    event["_id"] = str(event["_id"])
    return event

async def get_summary(period: str = "week") -> dict:
    days = {"day": 1, "week": 7, "month": 30}.get(period, 7)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    cursor = _collection().find({"created_at": {"$gte": since}})
    events = await cursor.to_list(length=10000)
    total = len(events)
    success = sum(1 for e in events if e.get("status") == "success")
    failed = total - success
    durations = [e.get("duration_ms", 0) for e in events if e.get("duration_ms")]
    avg_latency = int(sum(durations) / len(durations)) if durations else 0
    success_rate = round((success / total * 100), 1) if total > 0 else 0
    return {
        "period": period,
        "total_executions": total,
        "successful_executions": success,
        "failed_executions": failed,
        "success_rate": success_rate,
        "avg_latency_ms": avg_latency,
    }

async def get_workflow_metrics(workflow_id: str, period: str = "week") -> dict:
    days = {"day": 1, "week": 7, "month": 30}.get(period, 7)
    since = datetime.now(timezone.utc) - timedelta(days=days)
    cursor = _collection().find({"workflow_id": workflow_id, "created_at": {"$gte": since}})
    events = await cursor.to_list(length=10000)
    total = len(events)
    success = sum(1 for e in events if e.get("status") == "success")
    durations = [e.get("duration_ms", 0) for e in events if e.get("duration_ms")]
    return {
        "workflow_id": workflow_id,
        "period": period,
        "total_executions": total,
        "successful_executions": success,
        "failed_executions": total - success,
        "success_rate": round((success / total * 100), 1) if total > 0 else 0,
        "avg_latency_ms": int(sum(durations) / len(durations)) if durations else 0,
    }
