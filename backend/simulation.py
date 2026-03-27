# backend/simulation.py
import numpy as np

def _simulate_path(years: int, base_salary: float,
                   volatility: float, risk_tol: str):
    income = []
    satisfaction = []
    salary = base_salary
    sat = 0.6

    risk_factor = {
        "low": 0.8,
        "medium": 1.0,
        "high": 1.2
    }.get(risk_tol, 1.0)

    for _ in range(years):
        growth = np.random.normal(
            loc=0.05 * risk_factor,
            scale=volatility
        )
        salary *= (1 + growth)

        sat_change = np.random.normal(loc=0.0, scale=0.05)
        sat = max(0.0, min(1.0, sat + sat_change))

        income.append(salary)
        satisfaction.append(sat)

    return income, satisfaction


def run_simulation(req, runs: int = 500, years: int = 10):
    param = {
        "decision_a": {"base_salary": 30_000, "volatility": 0.10},
        "decision_b": {"base_salary": 45_000, "volatility": 0.20},
    }

    paths = {
        "decision_a": {"income": [], "satisfaction": []},
        "decision_b": {"income": [], "satisfaction": []},
    }

    for _ in range(runs):
        for key in ["decision_a", "decision_b"]:
            inc, sat = _simulate_path(
                years,
                param[key]["base_salary"],
                param[key]["volatility"],
                req.risk_tolerance,
            )
            paths[key]["income"].append(inc)
            paths[key]["satisfaction"].append(sat)

    summary = {}
    for key in ["decision_a", "decision_b"]:
        inc_arr = np.array(paths[key]["income"])
        sat_arr = np.array(paths[key]["satisfaction"])
        summary[key] = {
            "avg_final_income": float(inc_arr[:, -1].mean()),
            "final_income_std":  float(inc_arr[:, -1].std()),
            "avg_satisfaction":  float(sat_arr.mean()),
        }

    return summary