# Unit tests for ValuationService
# T5: UT for service layer

import pytest
from unittest.mock import AsyncMock
from app.models.schemas import ValuationRequest, BatchRequest
from app.services.valuation_service import ValuationService


@pytest.fixture
def mock_ml_client():
    return AsyncMock()


@pytest.fixture
def service(mock_ml_client):
    return ValuationService(mock_ml_client)


@pytest.mark.anyio
async def test_evaluate_single_success(service, mock_ml_client):
    mock_ml_client.predict.return_value = {
        "predictions": [425000.0],
        "model": "LinearRegression",
    }
    req = ValuationRequest(
        square_footage=2000, bedrooms=3, bathrooms=2, year_built=2010,
        lot_size=5000, distance_to_city_center=5.2, school_rating=8,
    )
    result = await service.evaluate_single(req)
    assert result.predicted_price == 425000.0
    assert result.currency == "USD"
    assert result.model_version == "LinearRegression"
    assert result.input_features["bedrooms"] == 3


@pytest.mark.anyio
async def test_evaluate_single_empty_predictions(service, mock_ml_client):
    mock_ml_client.predict.return_value = {"predictions": [], "model": "test"}
    req = ValuationRequest(
        square_footage=2000, bedrooms=3, bathrooms=2, year_built=2010,
        lot_size=5000, distance_to_city_center=5.2, school_rating=8,
    )
    result = await service.evaluate_single(req)
    assert result.predicted_price == 0.0


@pytest.mark.anyio
async def test_evaluate_batch_success_and_ranking(service, mock_ml_client):
    mock_ml_client.predict.return_value = {
        "predictions": [300000.0, 500000.0],
        "model": "LinearRegression",
    }
    req = BatchRequest(properties=[
        ValuationRequest(
            square_footage=1500, bedrooms=2, bathrooms=1, year_built=2000,
            lot_size=3000, distance_to_city_center=3.0, school_rating=7,
        ),
        ValuationRequest(
            square_footage=2500, bedrooms=4, bathrooms=3, year_built=2015,
            lot_size=6000, distance_to_city_center=8.0, school_rating=9,
        ),
    ])
    result = await service.evaluate_batch(req)
    assert len(result.predictions) == 2
    assert result.predictions[0].predicted_price == 500000.0
    assert result.predictions[0].rank == 1
    assert result.predictions[1].predicted_price == 300000.0
    assert result.predictions[1].rank == 2
    assert result.model_version == "LinearRegression"


@pytest.mark.anyio
async def test_evaluate_batch_calls_ml_once(service, mock_ml_client):
    mock_ml_client.predict.return_value = {
        "predictions": [100000.0, 200000.0, 150000.0],
        "model": "test",
    }
    req = BatchRequest(properties=[
        ValuationRequest(
            square_footage=1500, bedrooms=2, bathrooms=1, year_built=2000,
            lot_size=3000, distance_to_city_center=3.0, school_rating=7,
        ),
        ValuationRequest(
            square_footage=2500, bedrooms=4, bathrooms=3, year_built=2015,
            lot_size=6000, distance_to_city_center=8.0, school_rating=9,
        ),
        ValuationRequest(
            square_footage=1800, bedrooms=3, bathrooms=2, year_built=2005,
            lot_size=4000, distance_to_city_center=5.0, school_rating=8,
        ),
    ])
    await service.evaluate_batch(req)
    mock_ml_client.predict.assert_awaited_once()
