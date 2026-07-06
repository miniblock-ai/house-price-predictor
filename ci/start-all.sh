#!/usr/bin/env bash
#
# start-all.sh — Start all 4 microservices for E2E testing
#
# Prerequisites:
#   - Docker
#   - Python 3.10+ with uvicorn (set E2E_PYTHON to override auto-detection)
#   - JDK 21+ with JAVA_HOME set
#   - Maven (mvn in PATH)
#   - pnpm
#
# Usage:
#   ./ci/start-all.sh              # full startup (build Docker image)
#   ./ci/start-all.sh --skip-build # skip Docker build, use existing image
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOG_DIR="$PROJECT_ROOT/.log"
mkdir -p "$LOG_DIR"

PREDICTION_PORT=8000
ESTIMATOR_PORT=8001
MARKET_PORT=8002
PORTAL_PORT=3001

PASS() { echo -e "\e[32m[PASS]\e[0m $*"; }
FAIL() { echo -e "\e[31m[FAIL]\e[0m $*"; exit 1; }
INFO() { echo -e "\e[33m[INFO]\e[0m $*"; }

# Parse args
SKIP_BUILD=false
for arg in "$@"; do
    case "$arg" in
        --skip-build) SKIP_BUILD=true ;;
    esac
done

# ────────────────────────────────────────────
#  Port cleanup (skip Docker port 8000)
# ────────────────────────────────────────────
cleanup_port() {
    local port=$1
    local pids
    if command -v lsof &>/dev/null; then
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
    elif command -v ss &>/dev/null; then
        pids=$(ss -tlnp "sport = :$port" 2>/dev/null | grep -oP 'pid=\K\d+' || true)
    else
        pids=$(fuser "$port/tcp" 2>/dev/null || true)
    fi
    if [ -n "$pids" ]; then
        local first=true
        for pid in $pids; do
            if [ "$first" = true ]; then
                local proc_name
                proc_name=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
                INFO "Port $port in use by $proc_name (PID $pid) -- killed"
                first=false
            fi
            kill -9 "$pid" 2>/dev/null || true
        done
    fi
}

INFO "Checking port availability..."
cleanup_port $ESTIMATOR_PORT
cleanup_port $MARKET_PORT
cleanup_port $PORTAL_PORT
sleep 1
PASS "All ports available"

echo ""
echo "============================================"
echo "  E2E Services - Startup"
echo "============================================"
echo ""

# ────────────────────────────────────────────
#  1. price-prediction-api (:8000) via Docker
# ────────────────────────────────────────────
PREDICTION_DIR="$PROJECT_ROOT/services/price-prediction-api"
IMAGE_NAME="price-prediction-api"
CONTAINER_NAME="price-prediction-api"

if [ "$SKIP_BUILD" = false ]; then
    INFO "Building Docker image..."
    BUILD_LOG="$LOG_DIR/docker-build.log"
    if ! docker info &>/dev/null; then
        FAIL "Docker Desktop is not running. Please start Docker Desktop first."
    fi
    docker build -t "$IMAGE_NAME" "$PREDICTION_DIR" 2>"$BUILD_LOG"
    PASS "Docker image built: $IMAGE_NAME"
fi

INFO "Starting Docker container..."
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
docker run -d --name "$CONTAINER_NAME" -p "$PREDICTION_PORT":8000 "$IMAGE_NAME" >/dev/null 2>&1

# Health check
for i in $(seq 1 15); do
    sleep 2
    if curl -sf "http://127.0.0.1:$PREDICTION_PORT/health" | grep -q healthy 2>/dev/null; then
        PRED_READY=true
        break
    fi
    INFO "  Health check $i/15: waiting..."
done
if [ "${PRED_READY:-false}" != true ]; then
    FAIL "price-prediction-api failed to start"
fi
PASS "price-prediction-api ready at http://127.0.0.1:$PREDICTION_PORT"

# ────────────────────────────────────────────
#  2. value-estimator-api (:8001) via uvicorn
# ────────────────────────────────────────────
ESTIMATOR_DIR="$PROJECT_ROOT/services/value-estimator-api"
ESTIMATOR_LOG="$LOG_DIR/value-estimator-api.log"

# Auto-detect Python
PYTHON=${E2E_PYTHON:-}
if [ -z "$PYTHON" ]; then
    for cmd in python python3 py; do
        if command -v "$cmd" &>/dev/null && "$cmd" -c "import uvicorn" 2>/dev/null; then
            PYTHON="$cmd"
            break
        fi
    done
fi
if [ -z "$PYTHON" ]; then
    FAIL "Python with uvicorn not found. Set E2E_PYTHON env var."
fi

INFO "Starting value-estimator-api (port $ESTIMATOR_PORT)..."
cd "$ESTIMATOR_DIR"
$PYTHON -m uvicorn app.main:app --host 127.0.0.1 --port "$ESTIMATOR_PORT" >"$ESTIMATOR_LOG" 2>&1 &
EST_PID=$!
cd "$PROJECT_ROOT"
sleep 3

for i in $(seq 1 15); do
    if curl -sf "http://127.0.0.1:$ESTIMATOR_PORT/api/v1/health" >/dev/null 2>&1; then
        EST_READY=true
        break
    fi
    INFO "  Health check $i/15: waiting..."
    sleep 2
done
if [ "${EST_READY:-false}" != true ]; then
    FAIL "value-estimator-api failed - check $ESTIMATOR_LOG"
fi
PASS "value-estimator-api ready at http://127.0.0.1:$ESTIMATOR_PORT (PID $EST_PID)"

# ────────────────────────────────────────────
#  3. market-analysis-api (:8002) via Maven
# ────────────────────────────────────────────
MARKET_DIR="$PROJECT_ROOT/services/market-analysis-api"
MARKET_LOG="$LOG_DIR/market-analysis-api.log"

if ! command -v mvn &>/dev/null; then
    FAIL "mvn not found in PATH"
fi

INFO "Starting market-analysis-api (port $MARKET_PORT)..."
cd "$MARKET_DIR"
mvn spring-boot:run -q >"$MARKET_LOG" 2>&1 &
MARKET_PID=$!
cd "$PROJECT_ROOT"
sleep 5

for i in $(seq 1 20); do
    if curl -sf "http://127.0.0.1:$MARKET_PORT/api/v1/health" | grep -q healthy 2>/dev/null; then
        MARKET_READY=true
        break
    fi
    INFO "  Health check $i/20: waiting..."
    sleep 3
done
if [ "${MARKET_READY:-false}" != true ]; then
    FAIL "market-analysis-api failed - check $MARKET_LOG"
fi
PASS "market-analysis-api ready at http://127.0.0.1:$MARKET_PORT (PID $MARKET_PID)"

# ────────────────────────────────────────────
#  4. prediction-portal (:3001) via pnpm dev
# ────────────────────────────────────────────
PORTAL_DIR="$PROJECT_ROOT/frontend/apps/prediction-portal"
PORTAL_LOG="$LOG_DIR/prediction-portal.log"

if ! command -v pnpm &>/dev/null; then
    FAIL "pnpm not found in PATH"
fi

export CI=true

INFO "Starting prediction-portal (port $PORTAL_PORT)..."
cd "$PORTAL_DIR"
pnpm dev -p "$PORTAL_PORT" >"$PORTAL_LOG" 2>&1 &
PORTAL_PID=$!
cd "$PROJECT_ROOT"
sleep 3

# Phase 1: Wait for port LISTENING
for i in $(seq 1 15); do
    if ss -tlnp "sport = :$PORTAL_PORT" 2>/dev/null | grep -q LISTEN || \
       lsof -i :"$PORTAL_PORT" 2>/dev/null | grep -q LISTEN; then
        PORTAL_READY=true
        break
    fi
    sleep 2
done
if [ "${PORTAL_READY:-false}" != true ]; then
    FAIL "prediction-portal never opened port $PORTAL_PORT - check $PORTAL_LOG"
fi

# Phase 2: Wait for HTTP 200
PORTAL_READY=false
for i in $(seq 1 15); do
    if curl -sf "http://127.0.0.1:$PORTAL_PORT/api/health" >/dev/null 2>&1 || \
       curl -sf "http://127.0.0.1:$PORTAL_PORT" >/dev/null 2>&1; then
        PORTAL_READY=true
        break
    fi
    INFO "  Health check $i/15: waiting..."
    sleep 2
done
if [ "${PORTAL_READY:-false}" != true ]; then
    FAIL "prediction-portal failed - check $PORTAL_LOG"
fi
PASS "prediction-portal ready at http://127.0.0.1:$PORTAL_PORT (PID $PORTAL_PID)"

# ────────────────────────────────────────────
#  Save PIDs
# ────────────────────────────────────────────
PID_FILE="$PROJECT_ROOT/.e2e-pids.json"
cat > "$PID_FILE" <<EOF
{"predPid":0,"estPid":$EST_PID,"marketPid":$MARKET_PID,"portalPid":$PORTAL_PID}
EOF
INFO "PIDs saved to $PID_FILE"

echo ""
echo "============================================"
echo "  Services started successfully!"
echo "============================================"
echo ""
echo "  price-prediction-api:  http://127.0.0.1:$PREDICTION_PORT"
echo "  value-estimator-api:   http://127.0.0.1:$ESTIMATOR_PORT"
echo "  market-analysis-api:   http://127.0.0.1:$MARKET_PORT"
echo "  prediction-portal:     http://127.0.0.1:$PORTAL_PORT"
echo ""
echo "Run './ci/stop-all.sh' to stop all services"
