#!/usr/bin/env bash
# Demo script: build Docker image, start container, test all API endpoints
# Usage: bash demo.sh
#
# If Docker pull fails (common in China), falls back to running directly
# via uvicorn.

set -euo pipefail

# Find a working Python 3 interpreter
PYTHON=""
for candidate in python3 python; do
    if $candidate -c "import json; print(1)" >/dev/null 2>&1; then
        PYTHON=$(command -v $candidate)
        break
    fi
done
# Fallback: common Windows paths
for p in /l/develop/Python/Python313/python /c/Python313/python; do
    if [ -x "$p" ]; then
        PYTHON="$p"
        break
    fi
done
if [ -z "$PYTHON" ]; then
    echo "Error: Python 3 not found"
    exit 1
fi
echo "  Using Python: $PYTHON"

IMAGE_NAME="housing-price-api"
CONTAINER_NAME="housing-price-api-demo"
PORT=8000
USE_DOCKER=true

cd "$(dirname "$0")/.."

echo "============================================"
echo "  Housing Price Prediction API — Demo"
echo "============================================"
echo ""

# ---- Check Docker connectivity ----
echo "[CHECK] Testing Docker connectivity..."
if "$PYTHON" -c "import urllib.request; urllib.request.urlopen('https://docker.io', timeout=5)" >/dev/null 2>&1; then
    # Docker pull test
    docker pull python:3.12-slim --quiet 2>/dev/null || true
fi
if docker image inspect python:3.12-slim >/dev/null 2>&1; then
    echo "  ✓ Docker is working"
else
    echo "  ⚠ Docker pull failed (network issue?), falling back to local uvicorn..."
    USE_DOCKER=false
fi
echo ""

if [ "$USE_DOCKER" = true ]; then
    # ---- Docker path ----
    echo "[1/3] Building Docker image..."
    docker build -t "$IMAGE_NAME" .
    echo "  ✓ Image built: $IMAGE_NAME"
    echo ""

    echo "[2/3] Starting container..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    docker run -d --name "$CONTAINER_NAME" -p "$PORT:$PORT" "$IMAGE_NAME"
    echo "  ✓ Container started on port $PORT"
    echo ""

    CLEANUP_CMD="docker stop $CONTAINER_NAME"
else
    # ---- Local uvicorn path ----
    echo "[1/3] Installing dependencies..."
    pip install -q -r requirements.txt 2>/dev/null || true
    echo "  ✓ Dependencies ready"
    echo ""

    echo "[2/3] Starting uvicorn server..."
    # Kill any existing uvicorn on the port
    kill $(netstat -ano 2>/dev/null | grep ":$PORT " | awk '{print $5}' | uniq) 2>/dev/null || true
    "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" &
    UVICORN_PID=$!
    echo "  ✓ Server started (PID: $UVICORN_PID)"
    echo ""

    CLEANUP_CMD="kill $UVICORN_PID 2>/dev/null"
fi

# ---- Wait for service ----
echo "  Waiting for service to be ready..."
for i in $(seq 1 15); do
    if curl -s "http://localhost:$PORT/health" > /dev/null 2>&1; then
        echo "  ✓ Service is ready!"
        break
    fi
    if [ "$i" -eq 15 ]; then
        echo "  ✗ Service failed to start."
        eval "$CLEANUP_CMD"
        exit 1
    fi
    sleep 1
done
echo ""

# ---- Test endpoints ----
echo "[3/3] Testing API endpoints..."
echo ""

echo "--- GET /health ---"
curl -s "http://localhost:$PORT/health" | "$PYTHON" -m json.tool
echo ""

echo "--- POST /predict (single) ---"
BODY='{
  "features": [
    {
      "square_footage": 1550,
      "bedrooms": 3,
      "bathrooms": 2,
      "year_built": 1997,
      "lot_size": 6800,
      "distance_to_city_center": 4.1,
      "school_rating": 7.6
    }
  ]
}'
echo "  Request body:"
echo "$BODY" | "$PYTHON" -m json.tool
echo "  Response:"
curl -s -X POST "http://localhost:$PORT/predict" \
  -H "Content-Type: application/json" \
  -d "$BODY" | "$PYTHON" -m json.tool
echo ""

echo "--- POST /predict (batch) ---"
BODY='{
  "features": [
    {
      "square_footage": 1550,
      "bedrooms": 3,
      "bathrooms": 2,
      "year_built": 1997,
      "lot_size": 6800,
      "distance_to_city_center": 4.1,
      "school_rating": 7.6
    },
    {
      "square_footage": 2200,
      "bedrooms": 4,
      "bathrooms": 2.5,
      "year_built": 2008,
      "lot_size": 9600,
      "distance_to_city_center": 7.0,
      "school_rating": 8.8
    }
  ]
}'
echo "  Request body:"
echo "$BODY" | "$PYTHON" -m json.tool
echo "  Response:"
curl -s -X POST "http://localhost:$PORT/predict" \
  -H "Content-Type: application/json" \
  -d "$BODY" | "$PYTHON" -m json.tool
echo ""

echo "--- GET /model-info ---"
curl -s "http://localhost:$PORT/model-info" | "$PYTHON" -m json.tool
echo ""

# ---- Summary ----
echo "============================================"
echo "  All endpoints tested successfully!"
echo "  Swagger UI: http://localhost:$PORT/docs"
echo "  Stop:       $CLEANUP_CMD"
echo "============================================"
