# backend/main.py
from __future__ import annotations

import logging
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import SimRequest, SimulateResponse
from narrative import generate_narrative_comparison, generate_narrative_single
from simulation import run_simulation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lifesim-backend")

app = FastAPI(
    title="LifeSim Monte Carlo API",
    description="Backend for LifeSim – probabilistic life decision simulator with AI narratives.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root() -> Dict[str, Any]:
    return {
        "status": "ok",
        "docs": "/docs",
        "openapi": "/openapi.json",
        "message": "LifeSim backend is running.",
    }


@app.post("/simulate", response_model=SimulateResponse)
async def simulate(req: SimRequest) -> SimulateResponse:
    """Main simulation endpoint: vectorized Monte Carlo + scenarios + sensitivity + optional narratives."""
    try:
        sim_result = run_simulation(req)
    except Exception as exc:
        logger.exception("Simulation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Simulation failed. Please try again.") from exc

    narrative_text = ""
    comparison = None

    try:
        if req.narrative_mode == "without_narrative":
            narrative_text = (
                "Narrative mode is disabled. The numbers above still show how each path behaves "
                "across thousands of simulated futures."
            )
        elif req.narrative_mode == "compare_models":
            narrative_text, comparison = await generate_narrative_comparison(req, sim_result)
        else:
            narrative_text = await generate_narrative_single(req, sim_result)
    except Exception as exc:
        logger.exception("Narrative generation failed: %s", exc)
        narrative_text = (
            "We could not generate an AI story right now, but your simulation results above are still accurate. "
            "Try again later or switch to 'No Narrative' mode."
        )

    return SimulateResponse(simulation=sim_result, narrative=narrative_text, comparison=comparison)