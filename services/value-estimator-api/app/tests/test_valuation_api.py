# API tests for valuation endpoints
# T4: ValuationService + controllers

import pytest
from datetime import datetime
from httpx import ASGITransport, AsyncClient
import respx
from fastapi import FastAPI

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@respx.mock
@pytest.mark.anyio
async def test_valuation_single_returns_200(client):
    route = respx.post("http://localhost:8000/predict").mock(
        return_value=respx.MockResponse(
            200, json={"predictions": [425000.0], "model": "LinearRegression"}
        )
    )

    resp = await client.post("/api/v1/valuation", json={
        "square_footage": 2000,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 2010,
        "lot_size": 5000,
        "distance_to_city_center": 5.2,
        "school_rating": 8,
    })

    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["predicted_price"] == 425000.0
    assert data["currency"] == "USD"
    assert data["input_features"]["bedrooms"] == 3
    assert data["model_version"] == "LinearRegression"


@respx.mock
@pytest.mark.anyio
async def test_valuation_batch_returns_200(client):
    route = respx.post("http://localhost:8000/predict").mock(
        return_value=respx.MockResponse(
            200, json={"predictions": [425000.0, 310000.0], "model": "LinearRegression"}
        )
    )

    resp = await client.post("/api/v1/valuation/batch", json={
        "properties": [
            {"square_footage": 2000, "bedrooms": 3, "bathrooms": 2,
             "year_built": 2010, "lot_size": 5000,
             "distance_to_city_center": 5.2, "school_rating": 8},
            {"square_footage": 1500, "bedrooms": 2, "bathrooms": 1,
             "year_built": 2000, "lot_size": 3000,
             "distance_to_city_center": 3.0, "school_rating": 7},
        ]
    })

    assert resp.status_code == 200
    data = resp.json()["data"]
    assert len(data["predictions"]) == 2
    assert data["predictions"][0]["predicted_price"] == 425000.0
    assert data["predictions"][1]["predicted_price"] == 310000.0
    assert data["predictions"][0]["rank"] == 1
    assert data["predictions"][1]["rank"] == 2


@pytest.mark.anyio
async def test_valuation_single_invalid_payload_returns_422(client):
    resp = await client.post("/api/v1/valuation", json={
        "square_footage": 2000,
        "bedrooms": 0,
        "bathrooms": 2,
        "year_built": 2010,
        "lot_size": 5000,
        "distance_to_city_center": 5.2,
        "school_rating": 8,
    })
    assert resp.status_code == 422
