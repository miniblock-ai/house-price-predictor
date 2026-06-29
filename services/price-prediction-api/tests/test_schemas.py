"""Tests for Pydantic request/response schema validation."""

import pytest
from pydantic import ValidationError

from app.models.schemas import (
    HealthResponse,
    HouseFeatures,
    ModelInfoResponse,
    PredictRequest,
    PredictResponse,
)


class TestHouseFeatures:
    def test_valid_features(self, sample_features):
        features = HouseFeatures(**sample_features)
        assert features.square_footage == 1550.0

    def test_invalid_square_footage_zero(self, sample_features):
        sample_features["square_footage"] = 0
        with pytest.raises(ValidationError):
            HouseFeatures(**sample_features)

    def test_invalid_bedrooms_zero(self, sample_features):
        sample_features["bedrooms"] = 0
        with pytest.raises(ValidationError):
            HouseFeatures(**sample_features)

    def test_invalid_year_built_too_old(self, sample_features):
        sample_features["year_built"] = 1700
        with pytest.raises(ValidationError):
            HouseFeatures(**sample_features)

    def test_invalid_school_rating_negative(self, sample_features):
        sample_features["school_rating"] = -1
        with pytest.raises(ValidationError):
            HouseFeatures(**sample_features)

    def test_invalid_school_rating_over_10(self, sample_features):
        sample_features["school_rating"] = 11
        with pytest.raises(ValidationError):
            HouseFeatures(**sample_features)

    def test_missing_required_field(self, sample_features):
        del sample_features["bedrooms"]
        with pytest.raises(ValidationError):
            HouseFeatures(**sample_features)


class TestPredictRequest:
    def test_single_feature_in_list(self, sample_features):
        """A single feature should be passed as a list of one."""
        request = PredictRequest(features=[sample_features])
        assert len(request.features) == 1
        assert request.features[0].square_footage == 1550.0

    def test_batch_features(self, sample_features_list):
        """Multiple features should be passed as a list."""
        request = PredictRequest(features=sample_features_list)
        assert len(request.features) == 2

    def test_empty_list(self):
        """An empty list should be accepted (but predict will return [])"""
        request = PredictRequest(features=[])
        assert len(request.features) == 0

    def test_invalid_item_in_list(self, sample_features):
        sample_features["bedrooms"] = -1
        with pytest.raises(ValidationError):
            PredictRequest(features=[sample_features])


class TestPredictResponse:
    def test_response_shape(self):
        resp = PredictResponse(
            predictions=[250000.0, 320000.0],
            model="LinearRegression",
        )
        assert len(resp.predictions) == 2
        assert resp.model == "LinearRegression"


class TestHealthResponse:
    def test_healthy(self):
        resp = HealthResponse(
            status="healthy",
            model_loaded=True,
            model_type="LinearRegression",
        )
        assert resp.status == "healthy"

    def test_unhealthy(self):
        resp = HealthResponse(
            status="unhealthy", model_loaded=False, model_type=None
        )
        assert resp.model_loaded is False
        assert resp.model_type is None


class TestModelInfoResponse:
    def test_full_response(self):
        resp = ModelInfoResponse(
            model_type="LinearRegression",
            coefficients={"x1": 100.0},
            intercept=50.0,
            metrics={"r2_score": 0.95},
            features=["x1"],
        )
        assert resp.model_type == "LinearRegression"
        assert resp.intercept == 50.0
