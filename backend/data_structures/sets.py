from pydantic import BaseModel
from typing import List, Any, Optional

class SetState(BaseModel):
    items: List[Any]

class SetOperation(BaseModel):
    type: str # add, remove
    value: Any

class SetRequest(BaseModel):
    state: SetState
    operation: SetOperation

def simulate_set_operation_logic(req: SetRequest):
    state = req.state
    op = req.operation
    steps = []

    if op.type == "add":
        if op.value in state.items:
            idx = state.items.index(op.value)
            steps.append({
                "type": "search_found",
                "index": idx,
                "message": f"Value {op.value} already exists in the set. Sets only keep unique values."
            })
        else:
            steps.append({
                "type": "search_failed",
                "message": f"Value {op.value} not found. Safe to add."
            })
            state.items.append(op.value)
            steps.append({
                "type": "add",
                "index": len(state.items) - 1,
                "value": op.value,
                "message": f"Added {op.value} to the set."
            })

    elif op.type == "remove":
        if op.value in state.items:
            idx = state.items.index(op.value)
            steps.append({
                "type": "search_found",
                "index": idx,
                "message": f"Found {op.value} at internal index {idx}."
            })
            state.items.remove(op.value)
            steps.append({
                "type": "remove",
                "index": idx,
                "value": op.value,
                "message": f"Removed {op.value} from the set."
            })
        else:
            steps.append({
                "type": "search_failed",
                "message": f"KeyError: {op.value} is not in the set."
            })

    return {
        "new_state": state,
        "steps": steps
    }
