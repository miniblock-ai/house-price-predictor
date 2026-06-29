import json
import os
from pathlib import Path
from typing import cast

import joblib
import pandas as pd

from app.ml.base import BaseModel
from app.ml.linear_model import LinearModel
from app.utils.metrics import regression_metrics

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent.parent / "artifacts"
DATA_DIR = Path(__file__).resolve().parent / "data"

FEATURE_COLUMNS = [
    "square_footage",
    "bedrooms",
    "bathrooms",
    "year_built",
    "lot_size",
    "distance_to_city_center",
    "school_rating",
]

TARGET_COLUMN = "price"

MODEL_REGISTRY: dict[str, type[BaseModel]] = {
    "linear": LinearModel,
}


def _resolve_data_path(filename: str) -> str:
    """Look for data file relative to the ml module, then fall back to DATA_DIR."""
    return str(DATA_DIR / filename)


def load_dataset(path: str) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Load CSV and split into features (X) and target (y)."""
    df = pd.read_csv(path)
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN]
    return X, y


def train_model(model_type: str = "linear") -> BaseModel:
    """Full training pipeline: load data, train, evaluate, persist artifacts."""
    csv_path = _resolve_data_path("housing.csv")
    X_df, y = load_dataset(csv_path)

    model_class = MODEL_REGISTRY.get(model_type)
    if model_class is None:
        msg = f"Unknown model type '{model_type}'. Available: {list(MODEL_REGISTRY)}"
        raise ValueError(msg)

    X_np = X_df.values
    y_np = y.values

    # Train/Test split (80/20)
    split_idx = int(len(X_np) * 0.8)
    X_train, X_test = X_np[:split_idx], X_np[split_idx:]
    y_train, y_test = y_np[:split_idx], y_np[split_idx:]

    # Train
    model = model_class()
    model.train(X_train, y_train)
    model.set_feature_names(FEATURE_COLUMNS)

    # Evaluate
    y_pred = model.predict(X_test)
    metrics = regression_metrics(y_test, y_pred)
    model.set_metrics(metrics)

    # Persist
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, ARTIFACTS_DIR / "model.pkl")
    with open(ARTIFACTS_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    return model


def load_model() -> BaseModel | None:
    """Load a previously trained model from artifacts."""
    model_path = ARTIFACTS_DIR / "model.pkl"
    if model_path.exists():
        return cast(BaseModel, joblib.load(model_path))
    return None


def get_or_train_model(model_type: str = "linear") -> BaseModel:
    """Load cached model if available, otherwise train a new one.

    Set SKIP_TRAINING=1 to always skip training and use cached artifacts.
    """
    skip = os.environ.get("SKIP_TRAINING", "0") == "1"
    cached = load_model()
    if cached is not None and not skip:
        return cached
    return train_model(model_type)
