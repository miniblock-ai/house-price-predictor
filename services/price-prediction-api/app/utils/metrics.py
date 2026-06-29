import numpy as np
import numpy.typing as npt
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score


def regression_metrics(
    y_true: npt.NDArray[np.float64],
    y_pred: npt.NDArray[np.float64],
) -> dict[str, float]:
    """Compute standard regression metrics: R², MSE, MAE."""
    return {
        "r2_score": float(r2_score(y_true, y_pred)),
        "mse": float(mean_squared_error(y_true, y_pred)),
        "mae": float(mean_absolute_error(y_true, y_pred)),
    }
