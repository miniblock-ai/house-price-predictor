from abc import ABC, abstractmethod
from typing import Any

import numpy as np
import numpy.typing as npt


class BaseModel(ABC):
    """Abstract interface for all regression models.

    Implementations must provide train, predict, and get_info methods.
    This allows easy switching between algorithms (linear, ridge, forest, etc.)
    without changing the API layer.
    """

    @abstractmethod
    def train(
        self, X: npt.NDArray[np.float64], y: npt.NDArray[np.float64]
    ) -> None:
        """Fit the model on training data."""

    @abstractmethod
    def predict(
        self, X: npt.NDArray[np.float64]
    ) -> npt.NDArray[np.float64]:
        """Return predictions for input features."""

    @abstractmethod
    def set_feature_names(self, names: list[str]) -> None:
        """Set feature names for coefficient mapping in get_info."""

    @abstractmethod
    def set_metrics(self, metrics: dict[str, float]) -> None:
        """Set performance metrics after evaluation."""

    @abstractmethod
    def get_info(self) -> dict[str, Any]:
        """Return model metadata: type, coefficients, intercept, metrics."""
