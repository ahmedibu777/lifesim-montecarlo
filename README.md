# lifesim-montecarlo

LifeSim – Monte Carlo Life Decision Simulator with AI Narratives (Hackathon project, 2026).

A FastAPI + NumPy 2 backend runs thousands of Monte Carlo simulations for two life paths and returns full probability distributions, sensitivity analysis, and scenario stress tests. A multi-provider AI narrative system (NVIDIA NIM → Groq → Hugging Face → Together.ai) turns the numbers into a readable life story.

---

## Backend setup

### Prerequisites

- Python 3.10+
- GitHub Codespaces or local Python environment
- At least **one** of these API keys (optional but recommended for narratives):
  - NVIDIA NIM API key (`NVIDIA_API_KEY`)
  - Groq API key (`GROQ_API_KEY`)
  - Hugging Face API token (`HF_TOKEN`)
  - Together.ai API key (`TOGETHER_API_KEY`)

The simulator itself is 100% local/offline; these keys are only for generating narratives.

---

## Install dependencies (with virtualenv)

From the repo root:

```bash
cd backend

# 1) Create and activate virtual environment
python -m venv venv
# Windows: venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# 2) Install Python dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

To deactivate later:

```bash
deactivate
```

---

## Configure environment (.env)

In `backend/` there is a `.env.example` file. Copy it to `.env` and fill in what you have:

```bash
cd backend
cp .env.example .env
```

Then open `.env` and set your keys and optional limits, for example:

```env
# NVIDIA NIM (primary)
NVIDIA_API_KEY=your_nvidia_nim_key_here

# Groq fallback (optional)
GROQ_API_KEY=your_groq_key_here

# Hugging Face fallback (optional)
HF_TOKEN=your_hf_token_here

# Together.ai fallback (optional)
TOGETHER_API_KEY=your_together_key_here

# Simulation defaults (optional)
LIFESIM_DEFAULT_RUNS=2000
LIFESIM_DEFAULT_YEARS=10
LIFESIM_MAX_RUNS=10000
LIFESIM_MAX_YEARS=40
```

You only need **one** key for narratives; if all are missing, the API still returns full simulation data with a safe text fallback.

---

## Run the backend server

From repo root:

```bash
cd backend
source venv/bin/activate      # or venv\Scripts\activate on Windows
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- API docs (Swagger): `http://localhost:8000/docs`
- Health check: `http://localhost:8000/`

In GitHub Codespaces, use the forwarded 8000 port URL instead of `localhost`.

---

## Example API request (terminal, curl)

Basic simulation with AI narrative enabled:

```bash
curl -X POST "http://localhost:8000/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "decision_a": "Stay at my current job",
    "decision_b": "Start a business",
    "risk_tolerance": "medium",
    "years": 10,
    "runs": 2000,
    "narrative_mode": "with_narrative"
  }'
```

Typical response shape (shortened):

```json
{
  "simulation": {
    "base_paths": {
      "decision_a": {
        "avg_final_income": 58000.0,
        "final_income_std": 12000.0,
        "avg_satisfaction": 0.72,
        "p5_income": 41000.0,
        "p25_income": 52000.0,
        "p50_income": 58000.0,
        "p75_income": 64000.0,
        "p95_income": 73000.0,
        "min_income": 38000.0,
        "max_income": 76000.0,
        "histogram_bins": [...],
        "histogram_counts": [...]
      },
      "decision_b": { "...": "..." }
    },
    "sensitivity": [ ... ],
    "scenarios": [ ... ],
    "recommended_path": "decision_b"
  },
  "narrative": "Multi-paragraph AI-generated story...",
  "comparison": null
}
```

To disable narrative but keep all simulations:

```bash
curl -X POST "http://localhost:8000/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "decision_a": "Stay at my current job",
    "decision_b": "Start a business",
    "risk_tolerance": "medium",
    "years": 10,
    "runs": 2000,
    "narrative_mode": "without_narrative"
  }'
```

To compare two narrative styles (e.g. NVIDIA vs Groq):

```bash
curl -X POST "http://localhost:8000/simulate" \
  -H "Content-Type: application/json" \
  -d '{
    "decision_a": "Buy a house",
    "decision_b": "Rent and invest",
    "risk_tolerance": "medium",
    "years": 20,
    "runs": 3000,
    "narrative_mode": "compare_models"
  }'
```

---

## Run the frontend (web UI)

From repo root:

```bash
cd frontend
python -m http.server 8080
```

Then open:

- `http://localhost:8080/index.html` (or the Codespaces forwarded 8080 URL)

The frontend will:

- Call `POST /simulate` on the backend using `fetch`.
- Show:
  - Average outcomes for Path A and Path B
  - Risk profile + income bands (percentiles)
  - Simple histograms for each path
  - Scenario stress tests (Recession, Breakthrough, Health Crisis, Market Boom, Burnout)
  - Sensitivity insights (available via CSV export)
  - AI narrative (or comparison) if at least one API key is configured
- Let you:
  - Run demo presets (Startup vs Corporate, Grad vs Work, Buy vs Rent)
  - Download results as CSV
  - Copy a shareable URL with pre-filled parameters

---

## One-click demo flow (for judges)

1. **Start backend**  
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start frontend**  
   ```bash
   cd frontend
   python -m http.server 8080
   ```

3. Open `http://localhost:8080/index.html`  
   - Select a preset like **Startup vs Corporate**.
   - Click **RUN 10,000 SIMULATIONS**.
   - Walk through:
     - Base results for both paths
     - Distribution & risk view
     - Scenario stress tests
     - AI narrative (or style comparison)
     - CSV export / share link.
