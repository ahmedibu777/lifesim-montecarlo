# backend/config.py
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Optional

from dotenv import load_dotenv

# Load .env early
load_dotenv()


@dataclass(frozen=True)
class LLMConfig:
    nvidia_api_key: Optional[str]
    groq_api_key: Optional[str]
    hf_token: Optional[str]
    together_api_key: Optional[str]

    nvidia_model: str = "meta/llama-3.1-70b-instruct"
    groq_model: str = "llama-3.3-70b-versatile"
    hf_model: str = "nvidia/Nemotron-3-8B-Instruct"
    together_model: str = "meta-llama/Meta-Llama-3.1-70B-Instruct"


@dataclass(frozen=True)
class SimulationLimits:
    default_runs: int
    default_years: int
    max_runs: int
    max_years: int


@dataclass(frozen=True)
class Settings:
    llm: LLMConfig
    sim_limits: SimulationLimits


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def get_settings() -> Settings:
    llm = LLMConfig(
        nvidia_api_key=os.getenv("NVIDIA_API_KEY"),
        groq_api_key=os.getenv("GROQ_API_KEY"),
        hf_token=os.getenv("HF_TOKEN"),
        together_api_key=os.getenv("TOGETHER_API_KEY"),
    )
    limits = SimulationLimits(
        default_runs=_env_int("LIFESIM_DEFAULT_RUNS", 2000),
        default_years=_env_int("LIFESIM_DEFAULT_YEARS", 10),
        max_runs=_env_int("LIFESIM_MAX_RUNS", 10000),
        max_years=_env_int("LIFESIM_MAX_YEARS", 40),
    )
    return Settings(llm=llm, sim_limits=limits)


settings = get_settings()