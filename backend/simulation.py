# backend/simulation.py
from __future__ import annotations

from typing import Dict, List

import numpy as np

from models import (
    RiskTolerance,
    ScenarioName,
    ScenarioResult,
    SensitivityResult,
    SimulationPathSummary,
    SimulationResult,
    SimRequest,
)


# ---------- Core vectorized Monte Carlo ----------


def _simulate_paths_vectorized(
    runs: int,
    years: int,
    base_salary: float,
    volatility: float,
    risk_tol: RiskTolerance,
) -> tuple[np.ndarray, np.ndarray]:
    """Fully vectorized Monte Carlo over (runs, years).

    Returns:
        income_paths: shape (runs, years)
        sat_paths: shape (runs, years)
    """
    risk_factor = {
        RiskTolerance.low: 0.8,
        RiskTolerance.medium: 1.0,
        RiskTolerance.high: 1.2,
    }.get(risk_tol, 1.0)

    # Random normal growth for all paths and years
    growth = np.random.normal(
        loc=0.05 * risk_factor,
        scale=volatility,
        size=(runs, years),
    )  # (runs, years)

    # Income: salary_t = base_salary * prod(1 + growth_0..t)
    income_paths = np.empty((runs, years), dtype=float)
    income_paths[:, 0] = base_salary * (1.0 + growth[:, 0])
    for t in range(1, years):
        income_paths[:, t] = income_paths[:, t - 1] * (1.0 + growth[:, t])

    # Satisfaction: random walk between 0 and 1
    sat_changes = np.random.normal(loc=0.0, scale=0.05, size=(runs, years))
    sat_paths = np.empty((runs, years), dtype=float)
    sat_paths[:, 0] = np.clip(0.6 + sat_changes[:, 0], 0.0, 1.0)
    for t in range(1, years):
        sat_paths[:, t] = np.clip(sat_paths[:, t - 1] + sat_changes[:, t], 0.0, 1.0)

    return income_paths, sat_paths


def _summarize_paths(income_paths: np.ndarray, sat_paths: np.ndarray) -> SimulationPathSummary:
    """Compute summary statistics + histogram for a bundle of paths."""
    final_income = income_paths[:, -1]
    avg_final_income = float(final_income.mean())
    final_income_std = float(final_income.std())
    avg_satisfaction = float(sat_paths.mean())

    p5 = float(np.percentile(final_income, 5))
    p25 = float(np.percentile(final_income, 25))
    p50 = float(np.percentile(final_income, 50))
    p75 = float(np.percentile(final_income, 75))
    p95 = float(np.percentile(final_income, 95))
    min_income = float(final_income.min())
    max_income = float(final_income.max())

    counts, bin_edges = np.histogram(final_income, bins=24)
    histogram_bins = [float(b) for b in bin_edges.tolist()]
    histogram_counts = [int(c) for c in counts.tolist()]

    return SimulationPathSummary(
        avg_final_income=avg_final_income,
        final_income_std=final_income_std,
        avg_satisfaction=avg_satisfaction,
        p5_income=p5,
        p25_income=p25,
        p50_income=p50,
        p75_income=p75,
        p95_income=p95,
        min_income=min_income,
        max_income=max_income,
        histogram_bins=histogram_bins,
        histogram_counts=histogram_counts,
    )


# ---------- Scenario modifiers ----------


def _scenario_modifiers(scenario: ScenarioName) -> dict[str, float]:
    """Return multiplicative modifiers for salary and volatility."""
    mapping: dict[ScenarioName, dict[str, float]] = {
        ScenarioName.base: {"salary_mult": 1.0, "vol_mult": 1.0},
        ScenarioName.recession: {"salary_mult": 0.9, "vol_mult": 1.5},
        ScenarioName.breakthrough: {"salary_mult": 1.2, "vol_mult": 1.1},
        ScenarioName.health_crisis: {"salary_mult": 0.8, "vol_mult": 1.4},
        ScenarioName.market_boom: {"salary_mult": 1.3, "vol_mult": 1.6},
        ScenarioName.burnout: {"salary_mult": 0.95, "vol_mult": 1.2},
    }
    return mapping.get(scenario, {"salary_mult": 1.0, "vol_mult": 1.0})


# ---------- Sensitivity analysis (OAT, vectorized) ----------


def _run_oat_sensitivity(
    base_params: Dict[str, Dict[str, float]],
    req: SimRequest,
    base_summary: Dict[str, SimulationPathSummary],
) -> list[SensitivityResult]:
    """One-at-a-time sensitivity on base_salary and volatility per decision.

    Perturb +/-10% and compare avg_final_income and avg_satisfaction.
    Uses reduced runs for speed.
    """
    results: list[SensitivityResult] = []
    years = req.years
    runs = max(300, min(req.runs // 3, 2500))

    variables = ["base_salary", "volatility"]

    for path_key in ["decision_a", "decision_b"]:
        for var in variables:
            base_value = base_params[path_key][var]
            low_value = base_value * 0.9
            high_value = base_value * 1.1

            # Low
            low_params = base_params[path_key].copy()
            low_params[var] = low_value
            low_income, low_sat = _simulate_paths_vectorized(
                runs=runs,
                years=years,
                base_salary=low_params["base_salary"],
                volatility=low_params["volatility"],
                risk_tol=req.risk_tolerance,
            )
            low_summary = _summarize_paths(low_income, low_sat)

            # High
            high_params = base_params[path_key].copy()
            high_params[var] = high_value
            high_income, high_sat = _simulate_paths_vectorized(
                runs=runs,
                years=years,
                base_salary=high_params["base_salary"],
                volatility=high_params["volatility"],
                risk_tol=req.risk_tolerance,
            )
            high_summary = _summarize_paths(high_income, high_sat)

            base_inc = base_summary[path_key].avg_final_income
            base_sat = base_summary[path_key].avg_satisfaction

            impact_income = float(
                (abs(low_summary.avg_final_income - base_inc) + abs(high_summary.avg_final_income - base_inc)) / 2.0
            )
            impact_satisfaction = float(
                (abs(low_summary.avg_satisfaction - base_sat) + abs(high_summary.avg_satisfaction - base_sat)) / 2.0
            )

            results.append(
                SensitivityResult(
                    variable=f"{path_key}.{var}",
                    base_value=float(base_value),
                    low_value=float(low_value),
                    high_value=float(high_value),
                    impact_on_income=impact_income,
                    impact_on_satisfaction=impact_satisfaction,
                )
            )

    results.sort(key=lambda r: r.impact_on_income, reverse=True)
    return results


# ---------- Scenario batches ----------


def _run_scenarios(
    base_params: Dict[str, Dict[str, float]],
    req: SimRequest,
) -> list[ScenarioResult]:
    """Run separate simulation batches under macro scenarios."""
    years = req.years
    runs = max(600, min(req.runs, 3000))
    scenarios: list[ScenarioResult] = []

    for scen in [
        ScenarioName.recession,
        ScenarioName.breakthrough,
        ScenarioName.health_crisis,
        ScenarioName.market_boom,
        ScenarioName.burnout,
    ]:
        mods = _scenario_modifiers(scen)

        path_summaries: Dict[str, SimulationPathSummary] = {}

        for key in ["decision_a", "decision_b"]:
            inc, sat = _simulate_paths_vectorized(
                runs=runs,
                years=years,
                base_salary=base_params[key]["base_salary"] * mods["salary_mult"],
                volatility=base_params[key]["volatility"] * mods["vol_mult"],
                risk_tol=req.risk_tolerance,
            )
            path_summaries[key] = _summarize_paths(inc, sat)

        scenarios.append(ScenarioResult(scenario=scen, paths=path_summaries))

    return scenarios


# ---------- Public entry point ----------


def run_simulation(req: SimRequest) -> SimulationResult:
    """Run base vectorized simulation + sensitivity + scenarios."""
    years = req.years
    runs = req.runs

    base_params: Dict[str, Dict[str, float]] = {
        "decision_a": {"base_salary": 30_000.0, "volatility": 0.10},
        "decision_b": {"base_salary": 45_000.0, "volatility": 0.20},
    }

    base_paths: Dict[str, SimulationPathSummary] = {}

    for key in ["decision_a", "decision_b"]:
        inc, sat = _simulate_paths_vectorized(
            runs=runs,
            years=years,
            base_salary=base_params[key]["base_salary"],
            volatility=base_params[key]["volatility"],
            risk_tol=req.risk_tolerance,
        )
        base_paths[key] = _summarize_paths(inc, sat)

    sensitivity = _run_oat_sensitivity(base_params, req, base_paths)
    scenarios = _run_scenarios(base_params, req)

    best_key = max(
        ["decision_a", "decision_b"],
        key=lambda k: (base_paths[k].avg_final_income, base_paths[k].avg_satisfaction),
    )

    return SimulationResult(
        base_paths=base_paths,
        sensitivity=sensitivity,
        scenarios=scenarios,
        recommended_path=best_key,
    )