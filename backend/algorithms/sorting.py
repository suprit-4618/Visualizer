from pydantic import BaseModel
from typing import List

class SortState(BaseModel):
    array: List[int]

class SortRequest(BaseModel):
    state: SortState

def simulate_bubble_sort_logic(req: SortRequest):
    arr = req.state.array.copy()
    n = len(arr)
    steps = []
    
    for i in range(n):
        for j in range(0, n-i-1):
            steps.append({
                "type": "compare",
                "indices": [j, j+1],
                "message": f"Comparing {arr[j]} and {arr[j+1]}"
            })
            if arr[j] > arr[j+1]:
                steps.append({
                    "type": "swap",
                    "indices": [j, j+1],
                    "message": f"Swapping {arr[j]} and {arr[j+1]}"
                })
                arr[j], arr[j+1] = arr[j+1], arr[j]
        steps.append({
            "type": "sorted_element",
            "index": n-i-1,
            "message": f"Element {arr[n-i-1]} is in its correct sorted position."
        })
        
    return {
        "new_state": {"array": arr},
        "steps": steps
    }
