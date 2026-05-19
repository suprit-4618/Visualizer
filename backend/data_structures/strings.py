from pydantic import BaseModel
from typing import Optional
from fastapi import HTTPException

class StringState(BaseModel):
    value: str

class StringOperation(BaseModel):
    type: str # concat, substring, replace
    param1: Optional[str] = None # For concat: str to add. For substring: start idx. For replace: old char/str.
    param2: Optional[str] = None # For substring: end idx. For replace: new char/str.

class StringRequest(BaseModel):
    state: StringState
    operation: StringOperation

def simulate_string_operation_logic(req: StringRequest):
    state = req.state
    op = req.operation
    steps = []

    if op.type == "concat":
        to_add = op.param1 or ""
        old_val = state.value
        new_val = old_val + to_add
        steps.append({
            "type": "create_new",
            "message": "Strings are immutable. Creating a new string in memory."
        })
        steps.append({
            "type": "copy_old",
            "value": old_val,
            "message": f"Copying old characters: '{old_val}'"
        })
        steps.append({
            "type": "copy_new",
            "value": to_add,
            "message": f"Appending new characters: '{to_add}'"
        })
        state.value = new_val

    elif op.type == "substring":
        start = int(op.param1) if op.param1 else 0
        end = int(op.param2) if op.param2 else len(state.value)
        if start < 0 or end > len(state.value) or start > end:
            raise HTTPException(status_code=400, detail="Invalid substring indices")
            
        sub = state.value[start:end]
        steps.append({
            "type": "highlight_range",
            "start": start,
            "end": end,
            "message": f"Highlighting characters from index {start} to {end-1}."
        })
        steps.append({
            "type": "extract",
            "value": sub,
            "message": f"Extracted substring: '{sub}'"
        })
        state.value = sub

    elif op.type == "replace":
        old_str = op.param1 or ""
        new_str = op.param2 or ""
        if old_str in state.value:
            idx = state.value.find(old_str)
            steps.append({
                "type": "search",
                "target": old_str,
                "found_at": idx,
                "message": f"Found '{old_str}' at index {idx}."
            })
            new_val = state.value.replace(old_str, new_str, 1)
            steps.append({
                "type": "create_new",
                "message": "Strings are immutable. Creating a new string in memory."
            })
            steps.append({
                "type": "replace_chars",
                "old": old_str,
                "new": new_str,
                "message": f"Replaced '{old_str}' with '{new_str}'."
            })
            state.value = new_val
        else:
            steps.append({
                "type": "search_failed",
                "target": old_str,
                "message": f"'{old_str}' not found in the string."
            })
            
    else:
        raise HTTPException(status_code=400, detail="Unknown string operation")

    return {
        "new_state": state,
        "steps": steps
    }
