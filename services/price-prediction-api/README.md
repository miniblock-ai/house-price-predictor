# Price Prediction API

A containerized FastAPI service that trains a regression model and exposes prediction endpoints.

## Quick Start

### Docker Demo

```bash
cd demo

# Linux / macOS / WSL
bash demo.sh

# Windows PowerShell
.\demo.ps1
```

The script will: build image → start container → test all 3 endpoints → open Swagger UI link.

### Local (no Docker)

```bash
cd services/price-prediction-api
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker

```bash
cd services/price-prediction-api
docker build -t price-prediction-api .
docker run -p 8000:8000 price-prediction-api
```

Open Swagger UI: http://localhost:8000/docs

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/predict` | Predict housing price(s) |
| GET | `/model-info` | Model coefficients & metrics |

### Example: Single Prediction

`features` 统一为数组，单条传一个元素。

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      {"square_footage": 1550, "bedrooms": 3, "bathrooms": 2, "year_built": 1997, "lot_size": 6800, "distance_to_city_center": 4.1, "school_rating": 7.6}
    ]
  }'
```

### Example: Batch Prediction

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "features": [
      {"square_footage": 1550, "bedrooms": 3, "bathrooms": 2, "year_built": 1997, "lot_size": 6800, "distance_to_city_center": 4.1, "school_rating": 7.6},
      {"square_footage": 2200, "bedrooms": 4, "bathrooms": 2.5, "year_built": 2008, "lot_size": 9600, "distance_to_city_center": 7.0, "school_rating": 8.8}
    ]
  }'
```

## Configuration

| Env Variable | Default | Description |
|-------------|---------|-------------|
| `MODEL_TYPE` | `linear` | Model algorithm (`linear`, future: `ridge`, `forest`) |
| `SKIP_TRAINING` | `0` | Set to `1` to skip training and use cached model |

## Architecture

See `docs/hld/architecture.md` for system-level architecture.
