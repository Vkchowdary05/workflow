"""
Workflow Validation Service.

Validates a workflow definition before it is saved to the database.
Checks performed:
  1. Trigger must exist
  2. Steps array must not be empty
  3. Step IDs must be unique
  4. All referenced step IDs must exist
  5. No circular dependencies (DAG check via DFS)
"""

from fastapi import HTTPException


def validate_workflow(trigger: dict, steps: list[dict]) -> None:
    """
    Run all validation checks on the workflow.
    Raises HTTPException(400) with a clear message on any failure.
    """
    _check_trigger(trigger)
    _check_steps_not_empty(steps)
    _check_unique_step_ids(steps)
    step_ids = {step["id"] for step in steps}
    _check_step_references(steps, step_ids)
    _check_no_cycles(steps, step_ids)


def _check_trigger(trigger: dict) -> None:
    """Ensure the trigger exists and has a type."""
    if not trigger or not trigger.get("type"):
        raise HTTPException(
            status_code=400,
            detail="Trigger must exist and have a 'type' field.",
        )


def _check_steps_not_empty(steps: list[dict]) -> None:
    """Ensure the steps array is not empty."""
    if not steps:
        raise HTTPException(
            status_code=400,
            detail="Steps array must not be empty.",
        )


def _check_unique_step_ids(steps: list[dict]) -> None:
    """Ensure all step IDs are unique."""
    seen = set()
    for step in steps:
        step_id = step["id"]
        if step_id in seen:
            raise HTTPException(
                status_code=400,
                detail=f"Duplicate step id: '{step_id}'.",
            )
        seen.add(step_id)


def _check_step_references(steps: list[dict], valid_ids: set[str]) -> None:
    """Ensure every referenced step ID actually exists in the workflow."""
    for step in steps:
        # Check on_success
        ref = step.get("on_success")
        if ref and ref not in valid_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid step reference: '{ref}' in step '{step['id']}' (on_success).",
            )

        # Check on_failure
        ref = step.get("on_failure")
        if ref and ref not in valid_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid step reference: '{ref}' in step '{step['id']}' (on_failure).",
            )

        # Check on_complete (for delay steps)
        ref = step.get("on_complete")
        if ref and ref not in valid_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid step reference: '{ref}' in step '{step['id']}' (on_complete).",
            )

        # Check branches (for condition steps)
        branches = step.get("branches")
        if branches:
            for branch_key, branch_target in branches.items():
                if branch_target and branch_target not in valid_ids:
                    raise HTTPException(
                        status_code=400,
                        detail=(
                            f"Invalid step reference: '{branch_target}' "
                            f"in step '{step['id']}' (branches.{branch_key})."
                        ),
                    )


def _check_no_cycles(steps: list[dict], valid_ids: set[str]) -> None:
    """
    Build an adjacency graph from the steps and run DFS to detect cycles.
    Raises HTTPException if a back-edge (cycle) is found.
    """
    # Build adjacency list
    graph: dict[str, list[str]] = {sid: [] for sid in valid_ids}

    for step in steps:
        sid = step["id"]
        for ref in _get_outgoing_refs(step):
            if ref in valid_ids:
                graph[sid].append(ref)

    # DFS cycle detection
    WHITE, GRAY, BLACK = 0, 1, 2
    color: dict[str, int] = {sid: WHITE for sid in valid_ids}

    def dfs(node: str) -> bool:
        color[node] = GRAY
        for neighbour in graph[node]:
            if color[neighbour] == GRAY:
                return True  # back-edge → cycle
            if color[neighbour] == WHITE and dfs(neighbour):
                return True
        color[node] = BLACK
        return False

    for sid in valid_ids:
        if color[sid] == WHITE:
            if dfs(sid):
                raise HTTPException(
                    status_code=400,
                    detail="Cycle detected in workflow. Workflows must be a DAG.",
                )


def _get_outgoing_refs(step: dict) -> list[str]:
    """Collect all outgoing step references from a step."""
    refs: list[str] = []
    if step.get("on_success"):
        refs.append(step["on_success"])
    if step.get("on_failure"):
        refs.append(step["on_failure"])
    if step.get("on_complete"):
        refs.append(step["on_complete"])
    branches = step.get("branches")
    if branches:
        for target in branches.values():
            if target:
                refs.append(target)
    return refs
