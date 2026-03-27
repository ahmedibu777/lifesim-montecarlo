# backend/narrative.py
import os
from huggingface_hub import InferenceClient
from dotenv import load_dotenv

load_dotenv()

HF_API_TOKEN = os.getenv("HF_API_TOKEN")
if not HF_API_TOKEN:
    raise RuntimeError(
        "HF_API_TOKEN not set. "
        "Create a backend/.env file with your token."
    )

# Free NVIDIA Nemotron model on Hugging Face
MODEL_ID = "nvidia/Nemotron-3-8B-Instruct"

client = InferenceClient(
    model=MODEL_ID,
    token=HF_API_TOKEN,
)


def generate_narrative(req, summary: dict) -> str:
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