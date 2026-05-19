from pydantic import BaseModel
from typing import List, Any, Optional

class TupleState(BaseModel):
    items: List[Any]

class TupleOperation(BaseModel):
    type: str # access, mutate_error
    index: int
    value: Optional[Any] = None

class TupleRequest(BaseModel):
    state: TupleState
    operation: TupleOperation

def simulate_tuple_operation_logic(req: TupleRequest):
    state = req.state
    op = req.operation
    steps = []

    if op.type == "access":
        if 0 <= op.index < len(state.items):
            val = state.items[op.index]
            steps.append({
                "type": "access",
                "index": op.index,
                "value": val,
                "message": f"Accessed index {op.index}: {val}"
            })
        else:
            steps.append({
                "type": "error",
                "message": f"IndexError: tuple index out of range"
            })
            
    elif op.type == "mutate_error":
        steps.append({
            "type": "error_highlight",
            "index": op.index,
            "message": "TypeError: 'tuple' object does not support item assignment"
        })

    return {
        "new_state": state,
        "steps": steps
    }
