from pydantic import BaseModel
from typing import List, Optional
from fastapi import HTTPException

class ListState(BaseModel):
    capacity: int
    data: List[Optional[int]]
    size: int

class Operation(BaseModel):
    type: str # append, insert, pop, remove, set, get
    index: Optional[int] = None
    value: Optional[int] = None

class RequestModel(BaseModel):
    state: ListState
    operation: Operation

def get_new_capacity(old_size: int) -> int:
    new_allocated = (old_size >> 3) + (3 if old_size < 9 else 6)
    return old_size + new_allocated

def simulate_list_operation_logic(req: RequestModel):
    state = req.state
    op = req.operation
    steps = []
    
    if len(state.data) < state.capacity:
        state.data.extend([None] * (state.capacity - len(state.data)))
    
    if op.type == "append":
        if state.size == state.capacity:
            new_cap = get_new_capacity(state.size)
            steps.append({
                "type": "resize",
                "oldCap": state.capacity,
                "newCap": new_cap,
                "message": f"Capacity full! Growing array from {state.capacity} to {new_cap}."
            })
            state.capacity = new_cap
            state.data.extend([None] * (new_cap - len(state.data)))
        
        state.data[state.size] = op.value
        steps.append({
            "type": "add",
            "index": state.size,
            "value": op.value,
            "message": f"Appended {op.value} at index {state.size}. O(1) amortized."
        })
        state.size += 1

    elif op.type == "insert":
        if op.index is None or op.value is None:
            raise HTTPException(status_code=400, detail="Index and value required for insert")
        idx = op.index
        if idx < 0 or idx > state.size:
            raise HTTPException(status_code=400, detail="Index out of bounds")
            
        if state.size == state.capacity:
            new_cap = get_new_capacity(state.size)
            steps.append({
                "type": "resize",
                "oldCap": state.capacity,
                "newCap": new_cap,
                "message": f"Capacity full! Growing array from {state.capacity} to {new_cap}."
            })
            state.capacity = new_cap
            state.data.extend([None] * (new_cap - len(state.data)))
            
        shift_count = state.size - idx
        if shift_count > 0:
            steps.append({
                "type": "shift_right_start",
                "index": idx,
                "count": shift_count,
                "message": f"Shifting {shift_count} element(s) to the right to make room."
            })
            for i in range(state.size, idx, -1):
                state.data[i] = state.data[i-1]
            steps.append({
                "type": "shift_right_done",
                "index": idx,
                "message": f"Gap created at index {idx}."
            })
            
        state.data[idx] = op.value
        state.size += 1
        steps.append({
            "type": "add",
            "index": idx,
            "value": op.value,
            "message": f"Inserted {op.value} at index {idx}. O(n) operation."
        })

    elif op.type == "pop":
        idx = op.index if op.index is not None else state.size - 1
        if idx < 0 or idx >= state.size:
            raise HTTPException(status_code=400, detail="Index out of bounds")
        
        val = state.data[idx]
        steps.append({
            "type": "remove_mark",
            "index": idx,
            "value": val,
            "message": f"Popping element {val} at index {idx}."
        })
        
        shift_count = state.size - 1 - idx
        if shift_count > 0:
            for i in range(idx, state.size - 1):
                state.data[i] = state.data[i+1]
            steps.append({
                "type": "shift_left_done",
                "index": idx,
                "count": shift_count,
                "message": f"Shifted {shift_count} element(s) left. O(n) operation."
            })
            
        state.size -= 1
        state.data[state.size] = None
        steps.append({
            "type": "remove_done",
            "index": idx,
            "value": val,
            "message": f"Popped {val}. New size is {state.size}."
        })

    return {
        "new_state": state,
        "steps": steps
    }
