"""Tests for LinearModel implementation."""

import numpy as np
import pytest

from app.ml.linear_model import LinearModel


class TestLinearModelTrain:
    def test_train_updates_model(self, trained_model):
        """After training, the internal model should not be None."""
        assert trained_model._model is not None

    def test_train_accepts_different_shapes(self):
        """Model should train on any valid feature matrix."""
        rng = np.random.default_rng(42)
        X = rng.standard_normal((100, 7)).astype(np.float64)
        y = X[:, 0] * 100 + 50
        y = y.astype(np.float64)

        model = LinearModel()
        model.train(X, y)
        assert model._model is not None


class TestLinearModelPredict:
    def test_predict_returns_correct_length(self, trained_model):
        """Predict should return one prediction per input row."""
        rng = np.random.default_rng(99)
        X = rng.standard_normal((5, 7)).astype(np.float64)
        preds = trained_model.predict(X)
        assert len(preds) == 5

    def test_predict_single_row(self, trained_model):
        """Predict should work with single-row input."""
        X = np.array([[1550.0, 3, 2, 1997, 6800, 4.1, 7.6]])
        X = X.astype(np.float64)
        preds = trained_model.predict(X)
        assert len(preds) == 1
        assert isinstance(float(preds[0]), float)

    def test_predict_output_type(self, trained_model):
        """Predictions should be float64."""
        rng = np.random.default_rng(99)
        X = rng.standard_normal((3, 7)).astype(np.float64)
        preds = trained_model.predict(X)
        assert preds.dtype == np.float64


class TestLinearModelInfo:
    def test_get_info_returns_correct_structure(self, trained_model):
        """get_info should return all expected keys."""
        info = trained_model.get_info()
        assert set(info.keys()) == {
            "model_type",
            "coefficients",
            "intercept",
            "metrics",
            "features",
        }

    def test_get_info_model_type(self, trained_model):
        assert trained_model.get_info()["model_type"] == "LinearRegression"

    def test_get_info_coefficients_length(self, trained_model):
        """Should have one coefficient per feature."""
        info = trained_model.get_info()
        assert len(info["coefficients"]) == 7

    def test_get_info_intercept_is_float(self, trained_model):
        assert isinstance(trained_model.get_info()["intercept"], float)

    def test_get_info_features_list(self, trained_model):
        info = trained_model.get_info()
        assert info["features"] == [
            "square_footage",
            "bedrooms",
            "bathrooms",
            "year_built",
            "lot_size",
            "distance_to_city_center",
            "school_rating",
        ]

    def test_get_info_metrics_present(self, trained_model):
        """Metrics should exist (may be empty dict if not set)."""
        metrics = trained_model.get_info()["metrics"]
        assert isinstance(metrics, dict)


class TestLinearModelEdgeCases:
    def test_cannot_predict_before_train(self):
        """Predicting before training should raise RuntimeError."""
        model = LinearModel()
        X = np.array([[1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0]])
        with pytest.raises(RuntimeError, match="has not been trained"):
            model.predict(X)

    def test_cannot_get_info_before_train(self):
        """Getting info before training should raise RuntimeError."""
        model = LinearModel()
        with pytest.raises(RuntimeError, match="has not been trained"):
            model.get_info()

    def test_set_feature_names_persists(self, trained_model):
        """Feature names set via set_feature_names should be in get_info."""
        info = trained_model.get_info()
        assert "square_footage" in info["coefficients"]
