from pydantic import BaseModel
from typing import List, Optional, Any
from fastapi import HTTPException

class DictState(BaseModel):
    capacity: int
    size: int
    keys: List[Optional[str]]
    values: List[Optional[Any]]

class DictOperation(BaseModel):
    type: str # set, get, remove
    key: str
    value: Optional[Any] = None

class DictRequest(BaseModel):
    state: DictState
    operation: DictOperation

def hash_key(key: str, capacity: int) -> int:
    return sum(ord(c) for c in key) % capacity

def simulate_dict_operation_logic(req: DictRequest):
    state = req.state
    op = req.operation
    steps = []

    if len(state.keys) < state.capacity:
        state.keys.extend([None] * (state.capacity - len(state.keys)))
        state.values.extend([None] * (state.capacity - len(state.values)))

    if op.type == "set":
        idx = hash_key(op.key, state.capacity)
        steps.append({
            "type": "hash",
            "key": op.key,
            "hash_val": idx,
            "message": f"Hashing key '{op.key}' -> index {idx}"
        })

        original_idx = idx
        while state.keys[idx] is not None and state.keys[idx] != op.key:
            steps.append({
                "type": "probe",
                "index": idx,
                "message": f"Collision at {idx}. Probing..."
            })
            idx = (idx + 1) % state.capacity
            if idx == original_idx:
                raise HTTPException(status_code=400, detail="Hash map is full!")

        if state.keys[idx] == op.key:
            steps.append({
                "type": "update",
                "index": idx,
                "key": op.key,
                "value": op.value,
                "message": f"Updating existing key '{op.key}' at index {idx}."
            })
        else:
            state.size += 1
            steps.append({
                "type": "insert",
                "index": idx,
                "key": op.key,
                "value": op.value,
                "message": f"Inserting '{op.key}':{op.value} at empty slot {idx}."
            })

        state.keys[idx] = op.key
        state.values[idx] = op.value

    return {
        "new_state": state,
        "steps": steps
    }
