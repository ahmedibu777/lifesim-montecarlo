# lifesim-montecarlo
LifeSim – Monte Carlo Life Decision Simulator with Hugging Face Narratives (Hackathon project).

## Backend setup

### Prerequisites
- Python 3.10+
- A [Hugging Face](https://huggingface.co/settings/tokens) API token with inference access

### Install dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Configure environment
Create `backend/.env` (or export the variable in your shell):
```env
HF_API_TOKEN=your_huggingface_token_here
```

> **Note:** The backend uses the `https://router.huggingface.co` endpoint introduced by Hugging Face to replace the deprecated `api-inference.huggingface.co`. Make sure your `huggingface_hub` version is **0.27.0 or newer** (already pinned in `requirements.txt`).

### Run the server
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/`

### Example request
```bash
curl -X POST "http://localhost:8000/simulate" \
  -H "Content-Type: application/json" \
  -d '{"decision_a":"Stay at my current job","decision_b":"Start a business","risk_tolerance":"medium"}'
```

If `HF_API_TOKEN` is missing or the Hugging Face request fails, `/simulate` still returns HTTP 200 with the simulation results and a fallback narrative message.
