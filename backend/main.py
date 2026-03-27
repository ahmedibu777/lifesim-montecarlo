# backend/main.py
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from simulation import run_simulation
from narrative import generate_narrative

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

@app.get("/")
def root():
    return {"status": "ok", "docs": "/docs"}

@app.post("/simulate")
async def simulate(req: SimRequest):
    sim_result = run_simulation(req)
    try:
        story = generate_narrative(req, sim_result)
    except Exception as exc:
        logger.exception("Narrative generation failed: %s", exc)
        story = (
            "Narrative generation is currently unavailable. "
            "Please check your HF_API_TOKEN and try again. "
            "Your simulation results are shown above."
        )
    return {"simulation": sim_result, "narrative": story}