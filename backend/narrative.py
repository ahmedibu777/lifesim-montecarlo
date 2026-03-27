# backend/narrative.py
from __future__ import annotations

import json
import logging
from typing import Any, Dict, Optional, Tuple

import httpx

from config import settings
from models import NarrativeComparison, SimulationResult, SimRequest
from utils import choose_best_text, safe_get, truncate_text

logger = logging.getLogger(__name__)


# ---------- Provider-specific clients ----------


async def _call_nvidia(req: SimRequest, sim: SimulationResult) -> Optional[str]:
    """Primary: NVIDIA NIM (OpenAI-compatible endpoint)."""
    if not settings.llm.nvidia_api_key:
        return None

    system_prompt, user_prompt = _build_prompts(req, sim)
    body = {
        "model": settings.llm.nvidia_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": 512,
        "temperature": 0.7,
    }

    headers = {
        "Authorization": f"Bearer {settings.llm.nvidia_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                headers=headers,
                json=body,
            )
        resp.raise_for_status()
        data = resp.json()
        text = safe_get(data, "choices", [])
        if not text:
            return None
        content = text[0]["message"]["content"]
        return truncate_text(content)
    except Exception as exc:
        logger.warning("NVIDIA NIM failed: %s", exc)
        return None


async def _call_groq(req: SimRequest, sim: SimulationResult) -> Optional[str]:
    """Fallback 1: Groq."""
    if not settings.llm.groq_api_key:
        return None

    system_prompt, user_prompt = _build_prompts(req, sim)
    headers = {
        "Authorization": f"Bearer {settings.llm.groq_api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.llm.groq_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": 512,
        "temperature": 0.7,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers=headers,
                json=body,
            )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return truncate_text(content)
    except Exception as exc:
        logger.warning("Groq failed: %s", exc)
        return None


async def _call_hf(req: SimRequest, sim: SimulationResult) -> Optional[str]:
    """Fallback 2: Hugging Face Inference (Nemotron)."""
    if not settings.llm.hf_token:
        return None

    system_prompt, user_prompt = _build_prompts(req, sim)
    full_prompt = system_prompt + "\n\n" + user_prompt

    headers = {
        "Authorization": f"Bearer {settings.llm.hf_token}",
        "Content-Type": "application/json",
    }
    body = {
        "inputs": full_prompt,
        "parameters": {
            "max_new_tokens": 350,
            "temperature": 0.7,
            "top_p": 0.9,
        },
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                f"https://api-inference.huggingface.co/models/{settings.llm.hf_model}",
                headers=headers,
                json=body,
            )
        resp.raise_for_status()
        data = resp.json()
        if isinstance(data, list) and data and "generated_text" in data[0]:
            return truncate_text(data[0]["generated_text"])
        # Some models return plain string
        if isinstance(data, str):
            return truncate_text(data)
        return None
    except Exception as exc:
        logger.warning("HF Inference failed: %s", exc)
        return None


async def _call_together(req: SimRequest, sim: SimulationResult) -> Optional[str]:
    """Fallback 3: Together.ai."""
    if not settings.llm.together_api_key:
        return None

    system_prompt, user_prompt = _build_prompts(req, sim)
    headers = {
        "Authorization": f"Bearer {settings.llm.together_api_key}",
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.llm.together_model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "max_tokens": 512,
        "temperature": 0.7,
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.together.xyz/v1/chat/completions",
                headers=headers,
                json=body,
            )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return truncate_text(content)
    except Exception as exc:
        logger.warning("Together.ai failed: %s", exc)
        return None


# ---------- Prompt builder ----------


def _build_prompts(req: SimRequest, sim: SimulationResult) -> tuple[str, str]:
    a = sim.base_paths["decision_a"]
    b = sim.base_paths["decision_b"]

    system_prompt = (
        "You are an encouraging life-coach AI that explains probabilistic "
        "Monte Carlo simulation outcomes in warm, clear language. You never "
        "give financial or medical advice; you only describe possibilities."
    )

    user_prompt = f"""
The user is deciding between two life paths:

Path A: {req.decision_a}
Path B: {req.decision_b}

We ran Monte Carlo simulations over {req.years} years.

Base outcomes:
- Path A average final income: {a.avg_final_income:.0f}, std: {a.final_income_std:.0f}, avg satisfaction: {a.avg_satisfaction:.2f}
- Path B average final income: {b.avg_final_income:.0f}, std: {b.final_income_std:.0f}, avg satisfaction: {b.avg_satisfaction:.2f}

Risk tolerance: {req.risk_tolerance.value}

Write 3–4 short paragraphs:
1. Summarise what each path feels like financially and emotionally.
2. Explain trade-offs between money, volatility, and satisfaction.
3. Suggest which path might better match this risk tolerance (soft suggestion).
4. End with a gentle disclaimer that this is a simulation, not real advice.

Keep it under 350 words and write as if talking to a friend.
""".strip()

    return system_prompt, user_prompt


# ---------- Public APIs ----------


async def generate_narrative_single(req: SimRequest, sim: SimulationResult) -> str:
    """Try providers in order until one succeeds."""
    nvidia_text = await _call_nvidia(req, sim)
    groq_text = await _call_groq(req, sim) if not nvidia_text else None
    hf_text = await _call_hf(req, sim) if not nvidia_text and not groq_text else None
    together_text = await _call_together(req, sim) if not (nvidia_text or groq_text or hf_text) else None

    return choose_best_text(nvidia_text, groq_text, hf_text, together_text)


async def generate_narrative_comparison(req: SimRequest, sim: SimulationResult) -> tuple[str, NarrativeComparison]:
    """Return main narrative + side-by-side comparison text from two providers."""
    # Primary: NVIDIA; Secondary: Groq or HF as available.
    primary = await _call_nvidia(req, sim)
    secondary = await _call_groq(req, sim)
    if not secondary:
        secondary = await _call_hf(req, sim)

    main_text = choose_best_text(primary, secondary)

    comparison = NarrativeComparison(
        primary_model=settings.llm.nvidia_model,
        secondary_model=settings.llm.groq_model if settings.llm.groq_api_key else settings.llm.hf_model,
        primary_text=primary or "",
        secondary_text=secondary or "",
    )

    return main_text, comparison