"""Tests for regression metrics calculation."""

import numpy as np
import pytest

from app.utils.metrics import regression_metrics


class TestRegressionMetrics:
    def test_perfect_prediction(self):
        """R² should be 1.0, MSE and MAE should be 0 for perfect predictions."""
        y_true = np.array([100000.0, 200000.0, 300000.0, 400000.0])
        y_pred = np.array([100000.0, 200000.0, 300000.0, 400000.0])
        metrics = regression_metrics(y_true, y_pred)

        assert metrics["r2_score"] == pytest.approx(1.0)
        assert metrics["mse"] == pytest.approx(0.0)
        assert metrics["mae"] == pytest.approx(0.0)

    def test_constant_prediction(self):
        """R² should be 0.0 when model predicts the mean."""
        y_true = np.array([100000.0, 200000.0, 300000.0])
        y_mean = float(np.mean(y_true))
        y_pred = np.array([y_mean, y_mean, y_mean])
        metrics = regression_metrics(y_true, y_pred)

        assert metrics["r2_score"] == pytest.approx(0.0)
        assert metrics["mse"] > 0
        assert metrics["mae"] > 0

    def test_known_mse(self):
        """MSE should match manually computed value."""
        y_true = np.array([3.0, -0.5, 2.0, 7.0])
        y_pred = np.array([2.5, 0.0, 2.0, 8.0])
        metrics = regression_metrics(y_true, y_pred)

        expected_mse = (
            (0.5**2 + (-0.5)**2 + 0.0**2 + (-1.0)**2) / 4
        )
        assert metrics["mse"] == pytest.approx(expected_mse)

    def test_known_mae(self):
        """MAE should match manually computed value."""
        y_true = np.array([3.0, -0.5, 2.0, 7.0])
        y_pred = np.array([2.5, 0.0, 2.0, 8.0])
        metrics = regression_metrics(y_true, y_pred)

        expected_mae = (0.5 + 0.5 + 0.0 + 1.0) / 4
        assert metrics["mae"] == pytest.approx(expected_mae)

    def test_returns_correct_keys(self):
        """Should return all three expected metrics."""
        y_true = np.array([1.0, 2.0, 3.0])
        y_pred = np.array([1.1, 2.1, 2.9])
        metrics = regression_metrics(y_true, y_pred)

        assert set(metrics.keys()) == {"r2_score", "mse", "mae"}
