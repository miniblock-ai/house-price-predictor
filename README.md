# House Price Predictor — Implementation

Microservice-based implementation of the Housing Price Prediction System.

## Services

| Service | Directory | Stack | Status |
|---------|-----------|-------|--------|
| **Price Prediction API** | `services/price-prediction-api/` | Python 3.12+, FastAPI, Scikit-learn | ✅ |
| **Value Estimator API** | `services/value-estimator-api/` | FastAPI | ✅ |
| **Market Analysis API** | `services/market-analysis-api/` | Java 21, Spring Boot 3.4.4 | ✅ |
| **Frontend Portal** | `frontend/` | Next.js (pnpm workspace) | ✅ |

## Directory Layout

```
house-price-predictor/
├── services/                      # Backend microservices
│   ├── price-prediction-api/      # ML model API (Python)
│   │   ├── app/
│   │   │   ├── main.py            # FastAPI entry point
│   │   │   ├── models/            # Pydantic schemas
│   │   │   ├── ml/                # ML model (trainer, base class, implementations)
│   │   │   │   └── data/          # Training & test datasets
│   │   │   └── utils/             # Helper utilities
│   │   ├── artifacts/             # Trained model & metrics output
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   │
│   ├── value-estimator-api/       # Property valuation API (Python)
│   │   └── app/                   # FastAPI backend
│   │
│   └── market-analysis-api/       # Market analysis API (Java)
│       └── src/                   # Spring Boot backend
│
├── frontend/                      # Next.js portal (pnpm workspace)
│   ├── apps/
│   │   └── prediction-portal/     # Main portal app
│   └── libs/                      # Shared libraries
│       ├── shared-ui/             # UI component library
│       └── shared-config/         # Shared configuration (ESLint, Tailwind, TS)
│
├── deployment/                    # Docker Compose, orchestration configs
└── README.md                      # ← This file
```
