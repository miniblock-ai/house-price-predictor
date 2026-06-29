from typing import Any

import numpy as np
import numpy.typing as npt
from sklearn.linear_model import LinearRegression as SkLinearRegression

from app.ml.base import BaseModel


class LinearModel(BaseModel):
    """LinearRegression implementation wrapped in the BaseModel interface."""

    def __init__(self) -> None:
        self._model: SkLinearRegression | None = None
        self._feature_names: list[str] | None = None
        self._metrics: dict[str, float] = {}

    @property
    def model(self) -> SkLinearRegression:
        if self._model is None:
            raise RuntimeError("Model has not been trained yet.")
        return self._model

    def train(
        self, X: npt.NDArray[np.float64], y: npt.NDArray[np.float64]
    ) -> None:
        self._model = SkLinearRegression()
        self._model.fit(X, y)

    def predict(
        self, X: npt.NDArray[np.float64]
    ) -> npt.NDArray[np.float64]:
        result = self.model.predict(X)
        return np.asarray(result, dtype=np.float64)

    def set_feature_names(self, names: list[str]) -> None:
        self._feature_names = names

    def set_metrics(self, metrics: dict[str, float]) -> None:
        self._metrics = metrics

    def get_info(self) -> dict[str, Any]:
        model = self.model
        coefficients: dict[str, float] = {}
        if self._feature_names is not None:
            coefficients = dict(zip(self._feature_names, model.coef_))
        else:
            for i, c in enumerate(model.coef_):
                coefficients[f"feature_{i}"] = float(c)

        return {
            "model_type": "LinearRegression",
            "coefficients": coefficients,
            "intercept": float(model.intercept_),
            "metrics": self._metrics,
            "features": self._feature_names or [],
        }
