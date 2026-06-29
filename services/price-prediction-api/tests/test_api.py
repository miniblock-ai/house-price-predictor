"""Tests for FastAPI endpoints using TestClient.

Note: These tests rely on a model being loaded at app startup.
The app's lifespan loads/trains a model, so TestClient
will trigger training on first use.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create a TestClient — triggers app lifespan (model training)."""
    with TestClient(app) as c:
        yield c


class TestHealthEndpoint:
    def test_health_healthy(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True
        assert data["model_type"] == "LinearRegression"

    def test_health_response_shape(self, client):
        resp = client.get("/health")
        data = resp.json()
        assert set(data.keys()) == {"status", "model_loaded", "model_type"}


class TestPredictEndpoint:
    def test_single_prediction(self, client, sample_features):
        resp = client.post("/predict", json={"features": [sample_features]})
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["predictions"]) == 1
        assert isinstance(data["predictions"][0], float)
        assert data["model"] == "LinearRegression"

    def test_batch_prediction(self, client, sample_features_list):
        resp = client.post(
            "/predict", json={"features": sample_features_list}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["predictions"]) == 2
        assert data["model"] == "LinearRegression"

    def test_batch_predictions_differ(
        self, client, sample_features_list
    ):
        """Different inputs should produce different predictions."""
        resp = client.post(
            "/predict", json={"features": sample_features_list}
        )
        data = resp.json()
        assert data["predictions"][0] != data["predictions"][1]

    def test_missing_required_field_returns_422(self, client, sample_features):
        del sample_features["bedrooms"]
        resp = client.post(
            "/predict",
            json={"features": [sample_features]},
        )
        assert resp.status_code == 422

    def test_empty_features_list(self, client):
        resp = client.post(
            "/predict", json={"features": []}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["predictions"]) == 0

    def test_invalid_value_returns_422(self, client, sample_features):
        sample_features["square_footage"] = -100
        resp = client.post(
            "/predict",
            json={"features": [sample_features]},
        )
        assert resp.status_code == 422

    def test_predict_response_shape(self, client, sample_features):
        resp = client.post("/predict", json={"features": [sample_features]})
        data = resp.json()
        assert set(data.keys()) == {"predictions", "model"}


class TestModelInfoEndpoint:
    def test_model_info_success(self, client):
        resp = client.get("/model-info")
        assert resp.status_code == 200
        data = resp.json()
        assert data["model_type"] == "LinearRegression"
        assert "coefficients" in data
        assert "intercept" in data
        assert "metrics" in data
        assert "features" in data

    def test_model_info_coefficients(self, client):
        resp = client.get("/model-info")
        data = resp.json()
        assert len(data["coefficients"]) == 7
        assert len(data["features"]) == 7
