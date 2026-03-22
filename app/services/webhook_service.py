from app.core.database import get_database
from app.services.execution_service import execute_workflow

async def find_workflows_for_trigger(trigger_type: str) -> list[dict]:
    db = get_database()
    cursor = db["workflows"].find({"trigger.type": trigger_type, "status": "active"})
    return await cursor.to_list(length=100)

async def dispatch_executions(workflows: list[dict], trigger_data: dict) -> int:
    count = 0
    for wf in workflows:
        try:
            await execute_workflow(wf)
            count += 1
        except Exception:
            pass
    return count
