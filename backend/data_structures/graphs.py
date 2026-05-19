from pydantic import BaseModel
from typing import List, Optional

class GraphState(BaseModel):
    nodes: List[str]
    edges: List[List[str]]

class GraphOperation(BaseModel):
    type: str
    node1: Optional[str] = None
    node2: Optional[str] = None

class GraphRequest(BaseModel):
    state: GraphState
    operation: GraphOperation

def simulate_graph_operation_logic(req: GraphRequest):
    state = req.state
    op = req.operation
    steps = []
    
    if op.type == "add_node":
        if op.node1 in state.nodes:
            steps.append({
                "type": "error",
                "message": f"Node {op.node1} already exists."
            })
        else:
            state.nodes.append(op.node1)
            steps.append({
                "type": "add_node",
                "node": op.node1,
                "message": f"Added node {op.node1}."
            })
    elif op.type == "remove_node":
        if op.node1 not in state.nodes:
            steps.append({
                "type": "error",
                "message": f"Node {op.node1} does not exist."
            })
        else:
            state.nodes.remove(op.node1)
            # Remove all edges connected to this node
            new_edges = [edge for edge in state.edges if op.node1 not in edge]
            removed_edges = [edge for edge in state.edges if op.node1 in edge]
            state.edges = new_edges
            
            steps.append({
                "type": "remove_node",
                "node": op.node1,
                "removed_edges": removed_edges,
                "message": f"Removed node {op.node1} and its connected edges."
            })
    elif op.type == "add_edge":
        if op.node1 not in state.nodes or op.node2 not in state.nodes:
            steps.append({
                "type": "error",
                "message": f"Both nodes must exist to add an edge."
            })
        else:
            # Undirected edge check
            exists = any((set(edge) == {op.node1, op.node2}) for edge in state.edges)
            if exists:
                steps.append({
                    "type": "error",
                    "message": f"Edge between {op.node1} and {op.node2} already exists."
                })
            else:
                state.edges.append([op.node1, op.node2])
                steps.append({
                    "type": "add_edge",
                    "edge": [op.node1, op.node2],
                    "message": f"Added edge between {op.node1} and {op.node2}."
                })
    elif op.type == "remove_edge":
        target = {op.node1, op.node2}
        found_edge = next((edge for edge in state.edges if set(edge) == target), None)
        if found_edge:
            state.edges.remove(found_edge)
            steps.append({
                "type": "remove_edge",
                "edge": found_edge,
                "message": f"Removed edge between {op.node1} and {op.node2}."
            })
        else:
            steps.append({
                "type": "error",
                "message": f"Edge between {op.node1} and {op.node2} does not exist."
            })

    return {
        "new_state": state,
        "steps": steps
    }
