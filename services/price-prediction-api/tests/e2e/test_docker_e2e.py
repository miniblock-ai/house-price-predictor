"""E2E tests — start container from pre-built image, test via real HTTP.

Prerequisites:
  1. Docker installed and running
  2. Image built: docker build -t housing-price-api services/housing-price-prediction

Run with: pytest tests/e2e/ -v
"""

import subprocess
import time

import httpx
import pytest

IMAGE_NAME = "housing-price-api"
CONTAINER_NAME = "housing-price-api-e2e"
PORT = 8001  # avoid conflict with local dev


@pytest.fixture(scope="module")
def container_url():
    """Start container from pre-built image → yield URL → cleanup.

    Image must be built beforehand (e.g., by CI script or manual docker build).
    """
    # Clean up any leftover container from previous run
    subprocess.run(["docker", "rm", "-f", CONTAINER_NAME],
                   capture_output=True)
    # Run
    subprocess.run(
        [
            "docker", "run", "-d",
            "--name", CONTAINER_NAME,
            "-p", f"{PORT}:8000",
            IMAGE_NAME,
        ],
        check=True, capture_output=True,
    )
    # Wait for readiness
    url = f"http://localhost:{PORT}"
    for _ in range(15):
        try:
            r = httpx.get(f"{url}/health", timeout=2)
            if r.status_code == 200:
                break
        except httpx.RequestError:
            pass
        time.sleep(1)
    else:
        subprocess.run(["docker", "logs", CONTAINER_NAME], capture_output=True)
        subprocess.run(["docker", "rm", "-f", CONTAINER_NAME], capture_output=True)
        pytest.fail("Container failed to become ready")
    yield url
    # Teardown
    subprocess.run(["docker", "rm", "-f", CONTAINER_NAME], capture_output=True)


@pytest.mark.e2e
class TestE2E:
    def test_health(self, container_url):
        """GET /health returns healthy status."""
        resp = httpx.get(f"{container_url}/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True
        assert data["model_type"] == "LinearRegression"

    def test_predict_single(self, container_url):
        """POST /predict with one feature returns one prediction."""
        resp = httpx.post(
            f"{container_url}/predict",
            json={
                "features": [
                    {
                        "square_footage": 1550,
                        "bedrooms": 3,
                        "bathrooms": 2,
                        "year_built": 1997,
                        "lot_size": 6800,
                        "distance_to_city_center": 4.1,
                        "school_rating": 7.6,
                    }
                ]
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["predictions"]) == 1
        assert data["predictions"][0] > 0
        assert data["model"] == "LinearRegression"

    def test_predict_batch(self, container_url):
        """POST /predict with multiple features returns multiple predictions."""
        resp = httpx.post(
            f"{container_url}/predict",
            json={
                "features": [
                    {
                        "square_footage": 1550,
                        "bedrooms": 3,
                        "bathrooms": 2,
                        "year_built": 1997,
                        "lot_size": 6800,
                        "distance_to_city_center": 4.1,
                        "school_rating": 7.6,
                    },
                    {
                        "square_footage": 2200,
                        "bedrooms": 4,
                        "bathrooms": 2.5,
                        "year_built": 2008,
                        "lot_size": 9600,
                        "distance_to_city_center": 7.0,
                        "school_rating": 8.8,
                    },
                ]
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["predictions"]) == 2
        assert data["predictions"][0] != data["predictions"][1]

    def test_predict_invalid_returns_422(self, container_url):
        """Invalid input returns 422."""
        resp = httpx.post(
            f"{container_url}/predict",
            json={"features": [{"square_footage": -1, "bedrooms": 3}]},
        )
        assert resp.status_code == 422

    def test_model_info(self, container_url):
        """GET /model-info returns metadata."""
        resp = httpx.get(f"{container_url}/model-info")
        assert resp.status_code == 200
        data = resp.json()
        assert data["model_type"] == "LinearRegression"
        assert len(data["coefficients"]) == 7
        assert len(data["features"]) == 7
        assert "r2_score" in data["metrics"]
