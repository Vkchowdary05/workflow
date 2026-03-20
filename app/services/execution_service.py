"""
DAG Execution Engine.

Executes a workflow step-by-step:
  1. Starts from the trigger → first step
  2. For action steps → calls action simulator, follows on_success / on_failure
  3. For condition steps → evaluates (simulated), follows branches.true / branches.false
  4. For delay steps → logs simulated delay, follows on_complete / on_success
  5. Records StepLog for every step and persists the execution record
"""

import logging
from datetime import datetime, timezone

from app.repositories import execution_repo
from app.services.action_service import execute_action

logger = logging.getLogger("workflow.execution")

# Maximum steps to prevent infinite loops (safety net)
MAX_STEPS = 100


async def execute_workflow(workflow: dict) -> dict:
    """
    Execute the given workflow and return the execution record (dict).

    Args:
        workflow: The full workflow document from MongoDB.

    Returns:
        The execution record dict (with execution_id, status, step_logs, etc.)
    """
    workflow_id = str(workflow["_id"])
    steps = workflow.get("steps", [])
    trigger = workflow.get("trigger", {})

    # Build a lookup map: step_id → step dict
    step_map: dict[str, dict] = {step["id"]: step for step in steps}

    step_logs: list[dict] = []
    overall_status = "success"

    # ── Log the trigger ──
    step_logs.append({
        "step_id": "trigger",
        "step_type": "trigger",
        "action_type": None,
        "label": trigger.get("label", trigger.get("type", "trigger")),
        "status": "success",
        "message": f"Trigger fired: {trigger.get('type', 'unknown')}",
        "timestamp": datetime.now(timezone.utc),
    })

    # ── Determine first step ──
    current_step_id = _get_first_step_id(steps)
    if not current_step_id:
        step_logs.append({
            "step_id": "engine",
            "step_type": "system",
            "action_type": None,
            "label": "Engine",
            "status": "failed",
            "message": "No steps to execute after trigger.",
            "timestamp": datetime.now(timezone.utc),
        })
        overall_status = "failed"
    else:
        # ── Walk the DAG ──
        visited_count = 0
        while current_step_id and visited_count < MAX_STEPS:
            visited_count += 1
            step = step_map.get(current_step_id)

            if not step:
                step_logs.append({
                    "step_id": current_step_id,
                    "step_type": "unknown",
                    "action_type": None,
                    "label": None,
                    "status": "failed",
                    "message": f"Step '{current_step_id}' not found in workflow.",
                    "timestamp": datetime.now(timezone.utc),
                })
                overall_status = "failed"
                break

            step_type = step.get("type", "action")
            action_type = step.get("action_type")
            label = step.get("label", current_step_id)
            config = step.get("config", {})

            logger.info(f"▶ Executing step '{current_step_id}' ({step_type})")

            if step_type == "action":
                current_step_id, log_entry = await _execute_action_step(
                    step, action_type, config, label
                )
                step_logs.append(log_entry)
                if log_entry["status"] == "failed":
                    overall_status = "failed"

            elif step_type == "condition":
                current_step_id, log_entry = _execute_condition_step(step, config, label)
                step_logs.append(log_entry)

            elif step_type == "delay":
                current_step_id, log_entry = _execute_delay_step(step, config, label)
                step_logs.append(log_entry)

            else:
                # Unknown step type — try to continue via on_success
                step_logs.append({
                    "step_id": step["id"],
                    "step_type": step_type,
                    "action_type": action_type,
                    "label": label,
                    "status": "skipped",
                    "message": f"Unknown step type '{step_type}', skipping.",
                    "timestamp": datetime.now(timezone.utc),
                })
                current_step_id = step.get("on_success")

    # ── Persist execution record ──
    execution_data = {
        "workflow_id": workflow_id,
        "status": overall_status,
        "step_logs": step_logs,
    }
    execution = await execution_repo.create(execution_data)

    return _format_execution(execution)


# ── Step executors ──

async def _execute_action_step(
    step: dict, action_type: str, config: dict, label: str
) -> tuple[str | None, dict]:
    """Execute an action step and return (next_step_id, log_entry)."""
    result = await execute_action(action_type, config)
    status = result.get("status", "failed")
    message = result.get("message", "")

    if status == "success":
        next_id = step.get("on_success")
    else:
        next_id = step.get("on_failure")

    log_entry = {
        "step_id": step["id"],
        "step_type": "action",
        "action_type": action_type,
        "label": label,
        "status": status,
        "message": message,
        "timestamp": datetime.now(timezone.utc),
    }
    return next_id, log_entry


def _execute_condition_step(
    step: dict, config: dict, label: str
) -> tuple[str | None, dict]:
    """
    Evaluate a condition step (simulated).
    For simulation, we default to the 'true' branch.
    """
    branches = step.get("branches", {})

    # Simulated evaluation — always takes the 'true' path
    evaluated = True
    branch_key = "true" if evaluated else "false"
    next_id = branches.get(branch_key)

    log_entry = {
        "step_id": step["id"],
        "step_type": "condition",
        "action_type": step.get("condition_type"),
        "label": label,
        "status": "success",
        "message": f"Condition evaluated to '{branch_key}', moving to '{next_id}'",
        "timestamp": datetime.now(timezone.utc),
    }
    return next_id, log_entry


def _execute_delay_step(
    step: dict, config: dict, label: str
) -> tuple[str | None, dict]:
    """Simulate a delay step (no real waiting)."""
    duration = config.get("duration", 0)
    unit = config.get("unit", "seconds")

    # Determine next step — delay uses on_complete or on_success
    next_id = step.get("on_complete") or step.get("on_success")

    log_entry = {
        "step_id": step["id"],
        "step_type": "delay",
        "action_type": None,
        "label": label,
        "status": "success",
        "message": f"Delay simulated: {duration} {unit}. Moving to '{next_id}'.",
        "timestamp": datetime.now(timezone.utc),
    }
    return next_id, log_entry


# ── Helpers ──

def _get_first_step_id(steps: list[dict]) -> str | None:
    """Return the ID of the first step (by list order)."""
    if steps:
        return steps[0]["id"]
    return None


def _format_execution(execution: dict) -> dict:
    """Convert a raw MongoDB execution doc to a response-friendly dict."""
    return {
        "execution_id": str(execution["_id"]),
        "workflow_id": execution["workflow_id"],
        "status": execution["status"],
        "step_logs": execution.get("step_logs", []),
        "created_at": execution["created_at"],
        "updated_at": execution["updated_at"],
    }
