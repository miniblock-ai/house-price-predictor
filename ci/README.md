# CI Scripts — Microservice Management

Scripts for starting and stopping individual microservices or the entire stack for local development and E2E testing.

## Quick Start

```powershell
# Start all services (builds Docker image on first run)
.\ci\start-all.ps1

# Skip Docker build (use existing image)
.\ci\start-all.ps1 -SkipBuild

# Stop all services
.\ci\stop-all.ps1
```

## Individual Service Control

| Service | Port | Start | Stop |
|---------|:----:|-------|------|
| **price-prediction-api** (ML inference, Python/FastAPI, Docker) | 8000 | `.\ci\start-prediction.ps1` | `.\ci\stop-prediction.ps1` |
| **value-estimator-api** (Property valuation, Python/FastAPI, uvicorn) | 8001 | `.\ci\start-estimator.ps1` | `.\ci\stop-estimator.ps1` |
| **market-analysis-api** (Market analysis, Java/Spring Boot, Maven) | 8002 | `.\ci\start-market.ps1` | `.\ci\stop-market.ps1` |
| **prediction-portal** (Next.js frontend, pnpm) | 3001 | `.\ci\start-portal.ps1` | `.\ci\stop-portal.ps1` |

## Build Utilities

| Script | Purpose |
|--------|---------|
| `docker-build-prediction.ps1` | Build price-prediction-api Docker image only |

## Architecture

```
start-all.ps1 / stop-all.ps1  (orchestrator)
       |
       ├── start/stop-prediction.ps1   → Docker container (price-prediction-api)
       ├── start/stop-estimator.ps1    → uvicorn process  (value-estimator-api)
       ├── start/stop-market.ps1       → Maven process    (market-analysis-api)
       └── start/stop-portal.ps1       → pnpm dev process (prediction-portal)
```

- Each start script performs health checks before reporting success.
- Each stop script reads PIDs from `.e2e-pids.json`, then falls back to port-based cleanup.
- PIDs and container state are tracked in `.e2e-pids.json` at the project root.

## Port Mapping

| Service | Internal Port | Host Port |
|---------|:------------:|:---------:|
| price-prediction-api | 8000 | 8000 |
| value-estimator-api | 8000 | 8001 |
| market-analysis-api | 8002 | 8002 |
| prediction-portal | 3001 | 3001 |

## Prerequisites

- **Docker** — for price-prediction-api
- **Python 3.10+** with `uvicorn` — for value-estimator-api (set `E2E_PYTHON` env var to override auto-detection)
- **JDK 21+** with `JAVA_HOME` — for market-analysis-api
- **Maven** (`mvn.cmd` in PATH) — for market-analysis-api
- **pnpm** — for prediction-portal
