# backend/narrative.py
import logging
import os

from dotenv import load_dotenv
from huggingface_hub import InferenceClient

load_dotenv()

# Hugging Face router endpoint (replaces the deprecated api-inference.huggingface.co)
_MODEL_URL = (
    "https://router.huggingface.co/hf-inference/models/nvidia/Nemotron-3-8B-Instruct"
)

logger = logging.getLogger(__name__)

_client: InferenceClient | None = None


def _get_client() -> InferenceClient:
    """Return a cached HF client; raises a clear error if token is missing."""
    global _client
    if _client is not None:
        return _client
    token = os.getenv("HF_API_TOKEN")
    if not token:
        raise RuntimeError(
            "HF_API_TOKEN is not set. "
            "Create a backend/.env file or export the variable before starting the server."
        )
    _client = InferenceClient(model=_MODEL_URL, token=token)
    return _client


def generate_narrative(req, summary: dict) -> str:
    client = _get_client()

    prompt = f"""
You are an encouraging life-coach AI. The user is deciding between two paths:

Path A: {req.decision_a}
Path B: {req.decision_b}

We ran 500 Monte-Carlo simulations over 10 years. Here are the results:

Path A ({req.decision_a}):
- Average final income : ${summary['decision_a']['avg_final_income']:,.0f}
- Income volatility    : ${summary['decision_a']['final_income_std']:,.0f}
- Average satisfaction : {summary['decision_a']['avg_satisfaction']:.2f} / 1.0

Path B ({req.decision_b}):
- Average final income : ${summary['decision_b']['avg_final_income']:,.0f}
- Income volatility    : ${summary['decision_b']['final_income_std']:,.0f}
- Average satisfaction : {summary['decision_b']['avg_satisfaction']:.2f} / 1.0

The user's risk tolerance is: {req.risk_tolerance}.

In 3-4 short paragraphs:
1. Summarise the financial and happiness outcomes for each path.
2. Explain the trade-offs (money vs stability, growth vs security).
3. Give a gentle suggestion matching the user's risk tolerance.
4. Add a kind disclaimer: this is a fun simulation, not real advice.

Write in warm, simple language — like you are talking to a friend.
""".strip()

    output = client.text_generation(
        prompt,
        max_new_tokens=350,
        temperature=0.7,
        top_p=0.9,
        do_sample=True,
    )
    return output