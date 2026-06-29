import asyncio
import httpx
import time
import threading
from typing import Any

from app.config import settings
from app.exceptions import MLTimeoutError, MLUnavailableError

_lock = threading.Lock()


class MLClient:
    def __init__(self):
        self._failure_count = 0
        self._last_failure_time = 0.0
        self._client = httpx.AsyncClient(
            base_url=settings.ml_api_url,
            timeout=httpx.Timeout(settings.ml_api_timeout_connect, read=settings.ml_api_timeout_read),
        )

    async def predict(self, features: list[dict[str, Any]]) -> dict[str, Any]:
        if not self._allow_request():
            raise MLUnavailableError("Circuit breaker open: too many recent failures")

        try:
            result = await self._do_predict(features)
            with _lock:
                self._failure_count = 0
            return result
        except (httpx.TimeoutException, httpx.ConnectError) as e:
            with _lock:
                self._failure_count += 1
                self._last_failure_time = time.time()
            if isinstance(e, httpx.TimeoutException):
                raise MLTimeoutError("ML API request timed out") from e
            raise MLUnavailableError("ML API unreachable") from e

    async def _do_predict(self, features: list[dict[str, Any]]) -> dict[str, Any]:
        """Call ML API with exponential backoff retry.

        Manual retry loop (tenacity.wait_exponential broken on Python 3.13).
        Backoff: 500ms, 1s, 2s (max 3 attempts = 2 retries).
        """
        max_attempts = settings.ml_api_retry_max
        retryable = (httpx.TimeoutException, httpx.ConnectError)

        for attempt in range(max_attempts):
            try:
                resp = await self._client.post("/predict", json={"features": features})
                resp.raise_for_status()
                return resp.json()
            except retryable:
                if attempt < max_attempts - 1:
                    delay = min(500 * (2 ** attempt), 2000) / 1000.0
                    await asyncio.sleep(delay)
                else:
                    raise

    async def health_check(self) -> bool:
        try:
            resp = await self._client.get("/health", timeout=3.0)
            return resp.status_code == 200
        except Exception:
            return False

    def _allow_request(self) -> bool:
        with _lock:
            if self._failure_count >= 5:
                elapsed = time.time() - self._last_failure_time
                if elapsed < 30:
                    return False
                self._failure_count = 0
            return True
