# Housing Price Prediction — ML Prediction API (EPIC-01)

> **Service path**: `services/housing-price-prediction/`
> **Port**: 8000
> **Tech stack**: Python FastAPI — scikit-learn linear regression model

## 📖 Table of Contents

- [1. Prerequisites](#sec1)
- [2. Start Service](#sec2)
  - [2.1. Local (no Docker)](#sec2-1)
  - [2.2. Docker](#sec2-2)
  - [2.3. Docker Demo (one-click script)](#sec2-3)
  - [2.4. Environment Variables](#sec2-4)
- [3. Run Tests](#sec3)
  - [3.1. UT + IT (no Docker)](#sec3-1)
  - [3.2. E2E (requires Docker)](#sec3-2)
  - [3.3. Full CI pipeline](#sec3-3)
- [4. Test Inventory](#sec4)
- [5. API Endpoints](#sec5)
- [6. Project Structure](#sec6)
- [7. Change Log](#sec7)

<a id="sec1"></a>
## 1. Prerequisites

| Component | Version | Verification |
|:----------|:--------|:-------------|
| Python | ≥ 3.12 | `python --version` |
| pip | latest | `pip --version` |
| Docker (optional) | latest | `docker --version` |

> **Windows note**: In Git Bash, `python3` is a Windows Store stub (may fail silently). Always use `python`.

<a id="sec2"></a>
## 2. Start Service

<a id="sec2-1"></a>
### 2.1. Local (no Docker)

```bash
# 1. Enter service directory
cd services/housing-price-prediction

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start (train + serve)
python -m uvicorn app.main:app --reload --port 8000
```

On startup, the following happens automatically:
1. `lifespan` startup function executes
2. Loads `data/House Price Dataset.csv`
3. Trains a LinearRegression model
4. Model is cached in `artifacts/`
5. Service is ready on port 8000

Verify:
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","model_loaded":true,"model_type":"linear"}
```

<a id="sec2-2"></a>
### 2.2. Docker

```bash
cd services/housing-price-prediction
docker build -t housing-price-api .
docker run -p 8000:8000 housing-price-api
```

<a id="sec2-3"></a>
### 2.3. Docker Demo (one-click script)

```bash
cd demo

# Linux / macOS / WSL
bash demo.sh

# Windows PowerShell
.\demo.ps1
```

Script flow: build image → start container → test 3 endpoints → open Swagger UI.

<a id="sec2-4"></a>
### 2.4. Environment Variables

| Variable | Default | Description |
|:---------|:--------|:------------|
| `MODEL_TYPE` | `linear` | Model algorithm (currently only `linear` supported) |
| `SKIP_TRAINING` | `0` | Set to `1` to skip training and use cached model |

Usage:
```bash
MODEL_TYPE=linear python -m uvicorn app.main:app --reload --port 8000
```

<a id="sec3"></a>
## 3. Run Tests

> Run all commands from `services/housing-price-prediction/`.

<a id="sec3-1"></a>
### 3.1. UT + IT (no Docker)

```bash
# Run all UT/IT (excluding E2E)
python -m pytest tests/ --ignore tests/e2e -v

# Specific test file
python -m pytest tests/test_schemas.py -v
python -m pytest tests/test_linear_model.py -v
python -m pytest tests/test_api.py -v
python -m pytest tests/test_metrics.py -v
```

<a id="sec3-2"></a>
### 3.2. E2E (requires Docker)

```bash
# Build image first
docker build -t housing-price-api .

# Run E2E tests
python -m pytest tests/e2e/ -v
```

<a id="sec3-3"></a>
### 3.3. Full CI Pipeline

A one-click CI script is provided at the project root:

```bash
# Run from the project root
bash ci/ci.sh
```

CI pipeline: Type Check (mypy) → UT/IT → Docker Build → E2E

Windows users can also double-click `ci/ci.bat`.

<a id="sec4"></a>
## 4. Test Inventory

| File | Type | Description |
|:-----|:-----|:------------|
| `tests/test_schemas.py` | UT | Pydantic model validation, field constraints |
| `tests/test_linear_model.py` | UT | Linear regression training, prediction, serialization |
| `tests/test_metrics.py` | UT | Evaluation metrics (MAE, RMSE, R²) |
| `tests/test_api.py` | IT | FastAPI TestClient API endpoint tests |
| `tests/e2e/test_docker_e2e.py` | E2E | Docker container-level end-to-end tests |

<a id="sec5"></a>
## 5. API Endpoints

| Method | Path | Description |
|:-------|:-----|:------------|
| GET | `/health` | Health check + model status |
| POST | `/predict` | Price prediction (single / batch) |
| GET | `/model-info` | Model coefficients + performance metrics |

### Prediction Request Example

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      {
        "square_footage": 1550,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 1997,
        "lot_size": 6800,
        "distance_to_city_center": 4.1,
        "school_rating": 7.6
      }
    ]
  }'
```

### Batch Prediction

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      {"square_footage": 1550, "bedrooms": 3, ...},
      {"square_footage": 2200, "bedrooms": 4, ...}
    ]
  }'
```

> **Note**: `features` is always an array. Send a single-element array for single predictions to keep the API type consistent.

<a id="sec6"></a>
## 6. Project Structure

```
services/housing-price-prediction/
├── app/
│   ├── main.py              # FastAPI entry + lifespan (train/load model)
│   ├── models/
│   │   └── schemas.py       # Pydantic request/response models
│   ├── ml/
│   │   ├── base.py          # Model base class (BaseModel)
│   │   ├── linear_model.py  # LinearRegression implementation
│   │   ├── trainer.py       # get_or_train_model() training/cache logic
│   │   └── data/
│   │       ├── housing.csv  # Training dataset
│   │       └── test.csv     # Test dataset
│   └── utils/
│       └── metrics.py       # MAE, RMSE, R² evaluation functions
├── tests/
│   ├── test_schemas.py      # Model validation tests
│   ├── test_linear_model.py # Model training/prediction tests
│   ├── test_metrics.py      # Evaluation metrics tests
│   ├── test_api.py          # API endpoint tests
│   ├── conftest.py          # pytest fixtures
│   └── e2e/
│       └── test_docker_e2e.py # Docker E2E tests
├── ci/ci.sh / ci.bat        # CI automation scripts
├── Dockerfile               # Container build
├── requirements.txt         # Production dependencies
├── pyproject.toml           # Project config (pytest, mypy)
└── demo/
    ├── demo.sh              # Linux/WSL one-click demo
    └── demo.ps1             # PowerShell one-click demo
```
<a id="sec7"></a>
## 7. Change Log

| Date | rev | Changes |
|:-----|:---:|:--------|
| 2026-07-07 | rev1 | English rewrite + restructured with TOC, anchors, section numbering |
