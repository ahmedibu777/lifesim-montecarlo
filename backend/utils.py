# backend/utils.py
from __future__ import annotations

import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


def safe_get(dct: Optional[Dict[str, Any]], key: str, default: Any = None) -> Any:
    """Tiny helper to access nested dict responses from LLM APIs safely."""
    if not isinstance(dct, dict):
        return default
    return dct.get(key, default)


def truncate_text(text: str, max_chars: int = 4000) -> str:
    """Limit long model outputs to prevent UI overflow."""
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 20] + "\n\n...[truncated]"


def choose_best_text(*candidates: Optional[str]) -> str:
    """Return the first non-empty narrative candidate, or a fallback."""
    for c in candidates:
        if c and c.strip():
            return c.strip()
    return (
        "We could not generate an AI narrative right now, but your "
        "simulation numbers above are still valid. Consider running again later."
    )