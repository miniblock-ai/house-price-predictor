import logging
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from typing import Any

import numpy as np
from fastapi import FastAPI, HTTPException

from app.ml.base import BaseModel
from app.ml.trainer import get_or_train_model
from app.models.schemas import (
    HealthResponse,
    HouseFeatures,
    ModelInfoResponse,
    PredictRequest,
    PredictResponse,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(name)s  %(message)s",
)
logger = logging.getLogger(__name__)

# Global model reference — set during startup
_model: BaseModel | None = None


def _get_model() -> BaseModel:
    if _model is None:
        raise HTTPException(
            status_code=503, detail="Model not loaded"
        )
    return _model


def _features_to_array(features: list[HouseFeatures]) -> np.ndarray:
    """Convert a list of HouseFeatures into a 2D numpy array."""
    rows = [
        [
            f.square_footage,
            f.bedrooms,
            f.bathrooms,
            f.year_built,
            f.lot_size,
            f.distance_to_city_center,
            f.school_rating,
        ]
        for f in features
    ]
    return np.array(rows, dtype=np.float64)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Application lifespan: load or train model on startup."""
    global _model
    model_type = os.environ.get("MODEL_TYPE", "linear")
    logger.info("Starting up — loading model type: %s", model_type)
    try:
        _model = get_or_train_model(model_type)
        logger.info("Model loaded: %s", _model.get_info()["model_type"])
    except Exception:
        logger.exception("Failed to load/train model")
        _model = None
    yield
    logger.info("Shutting down.")


app = FastAPI(
    title="Housing Price Prediction API",
    description="Regression model API for predicting housing prices "
    "based on property features.",
    version="1.0.0",
    lifespan=lifespan,
)

@app.get("/health", response_model=HealthResponse, tags=["System"])
def health() -> HealthResponse:
    """Simple health check endpoint."""
    model = _model
    if model is None:
        return HealthResponse(
            status="unhealthy", model_loaded=False, model_type=None
        )
    info = model.get_info()
    return HealthResponse(
        status="healthy",
        model_loaded=True,
        model_type=info["model_type"],
    )


@app.post(
    "/predict",
    response_model=PredictResponse,
    tags=["Prediction"],
)
def predict(request: PredictRequest) -> PredictResponse:
    """Accept housing features and return price prediction(s).

    Supports both single and batch input.
    - Send a single feature object → one prediction.
    - Send an array of feature objects → batch predictions.
    """
    if not request.features:
        return PredictResponse(predictions=[], model="")

    model = _get_model()
    X = _features_to_array(request.features)
    preds = model.predict(X)
    model_info = model.get_info()

    return PredictResponse(
        predictions=[round(float(p), 2) for p in preds],
        model=model_info["model_type"],
    )


@app.get(
    "/model-info",
    response_model=ModelInfoResponse,
    tags=["Model"],
)
def model_info() -> dict[str, Any]:
    """Return model coefficients and performance metrics."""
    model = _get_model()
    return model.get_info()
