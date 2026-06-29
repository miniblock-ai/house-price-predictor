# Unit tests for MLClient
# T5: UT for ML client — retry tested via service-level tests

import pytest
import httpx
from unittest.mock import AsyncMock, patch
from app.services.ml_client import MLClient
from app.exceptions import MLTimeoutError, MLUnavailableError


@pytest.fixture
def client():
    return MLClient()


def _mkreq():
    return httpx.Request("POST", "http://localhost:8000/predict")


@pytest.mark.anyio
async def test_predict_success(client):
    with patch.object(client._client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value = httpx.Response(200, json={"predictions": [425000.0], "model": "LinearRegression"}, request=_mkreq())
        result = await client.predict([{"bedrooms": 3}])
        assert result["predictions"] == [425000.0]
        mock_post.assert_awaited_once()


@pytest.mark.anyio
async def test_predict_unrelated_exception_bubbles_up(client):
    with patch.object(client._client, "post", new_callable=AsyncMock) as mock_post:
        mock_post.side_effect = ValueError("unexpected")
        with pytest.raises(ValueError):
            await client.predict([{"bedrooms": 3}])
        assert mock_post.await_count == 1


@pytest.mark.anyio
async def test_health_check_success(client):
    with patch.object(client._client, "get", new_callable=AsyncMock) as mock_get:
        req = httpx.Request("GET", "http://localhost:8000/health")
        mock_get.return_value = httpx.Response(200, request=req)
        assert await client.health_check() is True


@pytest.mark.anyio
async def test_health_check_failure(client):
    with patch.object(client._client, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.ConnectError("refused")
        assert await client.health_check() is False


def test_circuit_breaker_opens_after_5_failures(client):
    client._failure_count = 5
    client._last_failure_time = __import__("time").time()
    assert client._allow_request() is False


def test_circuit_breaker_closes_after_30s(client):
    client._failure_count = 5
    client._last_failure_time = __import__("time").time() - 31
    assert client._allow_request() is True
    assert client._failure_count == 0


@pytest.mark.anyio
async def test_circuit_breaker_blocks_request_when_open(client):
    with patch.object(client._client, "post", new_callable=AsyncMock) as mock_post:
        client._failure_count = 5
        client._last_failure_time = __import__("time").time()
        with pytest.raises(MLUnavailableError, match="Circuit breaker open"):
            await client.predict([{"bedrooms": 3}])
        mock_post.assert_not_awaited()
