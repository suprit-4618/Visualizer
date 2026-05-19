from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from data_structures.lists import RequestModel as ListRequestModel, simulate_list_operation_logic
from data_structures.dictionaries import DictRequest as DictRequestModel, simulate_dict_operation_logic
from data_structures.strings import StringRequest as StringRequestModel, simulate_string_operation_logic
from data_structures.sets import SetRequest as SetRequestModel, simulate_set_operation_logic
from data_structures.tuples import TupleRequest as TupleRequestModel, simulate_tuple_operation_logic
from data_structures.graphs import GraphRequest as GraphRequestModel, simulate_graph_operation_logic
from algorithms.sorting import SortRequest as SortRequestModel, simulate_bubble_sort_logic

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/list/simulate")
def simulate_list_operation(req: ListRequestModel):
    return simulate_list_operation_logic(req)

@app.post("/api/dict/simulate")
def simulate_dict_operation(req: DictRequestModel):
    return simulate_dict_operation_logic(req)

@app.post("/api/string/simulate")
def simulate_string_operation(req: StringRequestModel):
    return simulate_string_operation_logic(req)

@app.post("/api/set/simulate")
def simulate_set_operation(req: SetRequestModel):
    return simulate_set_operation_logic(req)

@app.post("/api/tuple/simulate")
def simulate_tuple_operation(req: TupleRequestModel):
    return simulate_tuple_operation_logic(req)

@app.post("/api/graph/simulate")
def simulate_graph_operation(req: GraphRequestModel):
    return simulate_graph_operation_logic(req)

@app.post("/api/sort/bubble")
def simulate_bubble_sort(req: SortRequestModel):
    return simulate_bubble_sort_logic(req)
