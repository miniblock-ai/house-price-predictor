# Health endpoint /api/v1/health

import pytest
import respx
import httpx
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@respx.mock
@pytest.mark.asyncio
async def test_health_returns_200(client):
    respx.get("http://localhost:8000/health").mock(
        return_value=httpx.Response(200, request=httpx.Request("GET", "http://localhost:8000/health"))
    )
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200


@respx.mock
@pytest.mark.asyncio
async def test_health_has_required_fields(client):
    respx.get("http://localhost:8000/health").mock(
        return_value=httpx.Response(200, request=httpx.Request("GET", "http://localhost:8000/health"))
    )
    resp = await client.get("/api/v1/health")
    data = resp.json()
    assert data["code"] == 200
    assert data["message"] == "success"
    assert "status" in data["data"]
    assert "ml_api_reachable" in data["data"]
    assert "model_version" in data["data"]


@respx.mock
@pytest.mark.asyncio
async def test_health_returns_degraded_when_ml_unreachable(client):
    respx.get("http://localhost:8000/health").mock(
        side_effect=httpx.ConnectError("connection refused")
    )
    resp = await client.get("/api/v1/health")
    data = resp.json()["data"]
    assert data["status"] == "degraded"
    assert data["ml_api_reachable"] is False
    assert data["model_version"] == "unknown"


@respx.mock
@pytest.mark.asyncio
async def test_health_returns_dict(client):
    respx.get("http://localhost:8000/health").mock(
        return_value=httpx.Response(200, request=httpx.Request("GET", "http://localhost:8000/health"))
    )
    resp = await client.get("/api/v1/health")
    assert isinstance(resp.json()["data"], dict)
