"""Shared fixtures for all tests."""

import numpy as np
import pytest

from app.ml.linear_model import LinearModel


@pytest.fixture
def sample_features() -> dict:
    return {
        "square_footage": 1550.0,
        "bedrooms": 3,
        "bathrooms": 2.0,
        "year_built": 1997,
        "lot_size": 6800.0,
        "distance_to_city_center": 4.1,
        "school_rating": 7.6,
    }


@pytest.fixture
def sample_features_list() -> list[dict]:
    return [
        {
            "square_footage": 1550.0,
            "bedrooms": 3,
            "bathrooms": 2.0,
            "year_built": 1997,
            "lot_size": 6800.0,
            "distance_to_city_center": 4.1,
            "school_rating": 7.6,
        },
        {
            "square_footage": 2200.0,
            "bedrooms": 4,
            "bathrooms": 2.5,
            "year_built": 2008,
            "lot_size": 9600.0,
            "distance_to_city_center": 7.0,
            "school_rating": 8.8,
        },
    ]


@pytest.fixture
def trained_model() -> LinearModel:
    """A LinearModel trained on small synthetic data for testing."""
    rng = np.random.default_rng(42)
    X = rng.standard_normal((20, 7)).astype(np.float64)
    y = X @ np.array([100.0, 50.0, 80.0, 60.0, 5.0, -200.0, 300.0]) + 1000.0
    y = y.astype(np.float64)

    model = LinearModel()
    model.train(X, y)
    model.set_feature_names(
        [
            "square_footage",
            "bedrooms",
            "bathrooms",
            "year_built",
            "lot_size",
            "distance_to_city_center",
            "school_rating",
        ]
    )
    return model
