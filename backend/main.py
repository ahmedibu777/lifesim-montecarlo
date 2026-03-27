# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulation import run_simulation
from narrative import generate_narrative

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimRequest(BaseModel):
    decision_a: str
    decision_b: str
    risk_tolerance: str   # "low", "medium", "high"

@app.post("/simulate")
async def simulate(req: SimRequest):
    sim_result = run_simulation(req)
    story = generate_narrative(req, sim_result)
    return {"simulation": sim_result, "narrative": story}