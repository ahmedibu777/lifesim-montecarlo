# backend/models.py
from __future__ import annotations

from enum import Enum
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from config import settings


class RiskTolerance(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ScenarioName(str, Enum):
    base = "Base"
    recession = "Economic Recession"
    breakthrough = "Career Breakthrough"
    health_crisis = "Health Crisis"
    market_boom = "Market Boom"
    burnout = "Personal Burnout"


class NarrativeMode(str, Enum):
    with_narrative = "with_narrative"
    without_narrative = "without_narrative"
    compare_models = "compare_models"


class SimulationPathSummary(BaseModel):
    avg_final_income: float
    final_income_std: float
    avg_satisfaction: float

    p5_income: float
    p25_income: float
    p50_income: float
    p75_income: float
    p95_income: float

    min_income: float
    max_income: float

    histogram_bins: List[float]
    histogram_counts: List[int]


class SensitivityResult(BaseModel):
    variable: str
    base_value: float
    low_value: float
    high_value: float
    impact_on_income: float
    impact_on_satisfaction: float


class ScenarioResult(BaseModel):
    scenario: ScenarioName
    paths: Dict[str, SimulationPathSummary]


class SimulationResult(BaseModel):
    base_paths: Dict[str, SimulationPathSummary]
    sensitivity: List[SensitivityResult]
    scenarios: List[ScenarioResult]
    recommended_path: Literal["decision_a", "decision_b"]


class SimRequest(BaseModel):
    decision_a: str = Field(..., description="Label for path A")
    decision_b: str = Field(..., description="Label for path B")
    risk_tolerance: RiskTolerance
    years: int = Field(
        default=settings.sim_limits.default_years,
        ge=3,
        le=settings.sim_limits.max_years,
    )
    runs: int = Field(
        default=settings.sim_limits.default_runs,
        ge=200,
        le=settings.sim_limits.max_runs,
    )
    narrative_mode: NarrativeMode = NarrativeMode.with_narrative
    model_variant: Optional[str] = Field(
        default="nemotron",
        description="Additional model hint; backend may ignore or map it.",
    )


class NarrativeComparison(BaseModel):
    primary_model: str
    secondary_model: str
    primary_text: str
    secondary_text: str


class SimulateResponse(BaseModel):
    simulation: SimulationResult
    narrative: str
    comparison: Optional[NarrativeComparison] = None