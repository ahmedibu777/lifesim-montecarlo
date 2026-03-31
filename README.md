# LifeSim (Monte Carlo Life Decision Simulator)

LifeSim is a hackathon project (2026) that runs thousands of Monte Carlo simulations for two life paths and optionally turns the results into a friendly narrative using an LLM provider.

- **Backend**: FastAPI + NumPy (in `backend/`)
- **Frontend**: static web UI (in `frontend/`)
- **LLM providers (optional)**: NVIDIA NIM → Groq → Hugging Face → Together.ai (automatic fallback)

If you don’t configure any API keys, you still get full simulation results and a safe fallback narrative.

---

## Table of contents

- [Quick start (recommended defaults)](#quick-start-recommended-defaults)
- [Run in GitHub Codespaces](#run-in-github-codespaces)
- [Run locally (Linux/macOS)](#run-locally-linuxmacos)
- [Run locally (Windows)](#run-locally-windows)
- [Run on a cloud VM (AWS / GCP / Azure)](#run-on-a-cloud-vm-aws--gcp--azure)
- [Configure environment variables (.env)](#configure-environment-variables-env)
- [Check the backend is working](#check-the-backend-is-working)
- [Recommended simulation sizes (runs/years)](#recommended-simulation-sizes-runsyears)
- [Avoiding “system uvicorn” problems](#avoiding-system-uvicorn-problems)
- [Uninstalling uvicorn installed globally](#uninstalling-uvicorn-installed-globally)
- [Changing the LLM provider or model](#changing-the-llm-provider-or-model)
- [Getting API keys (4 providers)](#getting-api-keys-4-providers)
- [Troubleshooting](#troubleshooting)

---

## Quick start (recommended defaults)

From repo root:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal:

```bash
cd frontend
python3 -m http.server 8080
```

Open:
- Backend docs: `http://127.0.0.1:8000/docs`
- Frontend: `http://127.0.0.1:8080/index.html`

---

## Run in GitHub Codespaces

1. GitHub → **Code** → **Codespaces** → Create.
2. Start backend:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# (Optional) edit .env and add at least one key (NVIDIA_API_KEY / GROQ_API_KEY / HF_TOKEN / TOGETHER_API_KEY)

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. Start frontend:

```bash
cd frontend
python3 -m http.server 8080
```

4. In Codespaces, use the forwarded ports:
- `...-8000.app.github.dev/docs`
- `...-8080.app.github.dev/index.html`

---

## Run locally (Linux/macOS)

```bash
git clone https://github.com/ahmedibu777/lifesim-montecarlo.git
cd lifesim-montecarlo

cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
# optional: edit backend/.env to add API keys

uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
python3 -m http.server 8080
```

---

## Run locally (Windows)

PowerShell:

```powershell
git clone https://github.com/ahmedibu777/lifesim-montecarlo.git
cd lifesim-montecarlo

cd backend
py -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

copy .env.example .env
# optional: edit backend\.env to add API keys

uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd frontend
py -m http.server 8080
```

---

## Run on a cloud VM (AWS / GCP / Azure)

This is the same as local Linux, plus opening ports.

### VM suggestions
- Ubuntu 22.04+ recommended
- 1–2 vCPU, 1–2GB RAM is enough

### Open firewall / security group ports
- `8000/tcp` backend
- `8080/tcp` frontend (optional)

### Install + run

```bash
sudo apt-get update
sudo apt-get install -y git python3 python3-venv python3-pip

git clone https://github.com/ahmedibu777/lifesim-montecarlo.git
cd lifesim-montecarlo/backend

python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp .env.example .env
nano .env  # optional: add keys

# bind publicly
uvicorn main:app --host 0.0.0.0 --port 8000
```

Frontend:

```bash
cd ../frontend
python3 -m http.server 8080 --bind 0.0.0.0
```

**Production note:** for real deployments, use a reverse proxy (nginx) + HTTPS + systemd.

---

## Configure environment variables (.env)

Copy the example:

```bash
cd backend
cp .env.example .env
```

Keys (optional):

```env
NVIDIA_API_KEY=...
GROQ_API_KEY=...
HF_TOKEN=...
TOGETHER_API_KEY=...
```

Simulation defaults (optional):

```env
LIFESIM_DEFAULT_RUNS=2000
LIFESIM_DEFAULT_YEARS=10
LIFESIM_MAX_RUNS=10000
LIFESIM_MAX_YEARS=40
```

---

## Check the backend is working

### 1) Health check

```bash
curl http://127.0.0.1:8000/
```

Expected: JSON with `status: ok`.

### 2) Docs
Open: `http://127.0.0.1:8000/docs`

### 3) Run a sample simulation

```bash
curl -X POST "http://127.0.0.1:8000/simulate" \
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

If you don’t have any provider keys, the request still succeeds but returns a fallback narrative.

---

## Recommended simulation sizes (runs/years)

- **Demo (fast):** `runs=500`, `years=10`
- **Default (balanced):** `runs=2000`, `years=10`
- **Heavy (slower):** `runs=10000`, `years=20`

Notes:
- `runs` increases CPU cost roughly linearly.
- Very large `years` makes scenario/sensitivity computation heavier.

---

## Avoiding “system uvicorn” problems

If you see errors like `ModuleNotFoundError: No module named fastapi`, you are probably running **system uvicorn** instead of the venv one.

### Check which uvicorn/python you’re using

```bash
which python3
which uvicorn
```

They should point to `backend/venv/bin/...`.

### Safer way to start uvicorn

```bash
python3 -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

---

## Uninstalling uvicorn installed globally

If you previously installed uvicorn globally and want to remove it:

### If you installed via pip (recommended removal)

```bash
pip uninstall uvicorn
```

### If it came from apt (Ubuntu/Debian)

```bash
sudo apt-get remove -y uvicorn
```

Then always run uvicorn from your venv (`backend/venv/bin/uvicorn`) or with `python3 -m uvicorn`.

---

## Changing the LLM provider or model

### Where to change it
Model defaults are in:
- `backend/config.py` (`LLMConfig` fields)

Provider call logic + fallback order is in:
- `backend/narrative.py`

### Change models using environment variables
Add these to `backend/.env` (examples):

```env
# model overrides
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
GROQ_MODEL=llama-3.3-70b-versatile
HF_MODEL=nvidia/Nemotron-3-8B-Instruct
TOGETHER_MODEL=meta-llama/Meta-Llama-3.1-70B-Instruct
```

### Force a specific provider
Just set *one* provider key and leave the others empty.

---

## Getting API keys (4 providers)

> Keep keys in `backend/.env` locally, or in Codespaces Secrets / Cloud Secret Manager in production.

### 1) NVIDIA NIM (`NVIDIA_API_KEY`)
- Create an NVIDIA developer account and generate an API key for NIM.

### 2) Groq (`GROQ_API_KEY`)
- Sign up on Groq and create an API key.

### 3) Hugging Face (`HF_TOKEN`)
- Hugging Face → Settings → Access Tokens → create a token.

### 4) Together.ai (`TOGETHER_API_KEY`)
- Together.ai dashboard → create an API key.

---

## Troubleshooting

### Narrative keeps failing
- Verify at least one key is set in `backend/.env`
- Check the uvicorn logs for 401/403 (bad key), 429 (rate limit), or model not found

### `python` command not found
Use `python3` (Linux) or `py` (Windows).

### Port already in use
Change ports, e.g. `--port 8001`.