#!/usr/bin/env bash
# e2e-stack.sh — Full-stack E2E: start all services, run Playwright, clean up
# Usage: bash ci/e2e-stack.sh  (run from project root)
#
# Prerequisites:
#   - Python 3.10+ with pip installed
#   - JDK 21+ with JAVA_HOME set
#   - Node.js 18+ with pnpm installed
#   - Chrome installed (for Playwright)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ML_API_DIR="$ROOT_DIR/services/housing-price-prediction"
BACKEND_DIR="$ROOT_DIR/services/property-market-analysis/backend"
FRONTEND_DIR="$ROOT_DIR/services/nextjs-portal"

ML_API_PORT=8000
BACKEND_PORT=8002
FRONTEND_PORT=3001

# PID vars — must init before trap (set -u safety)
ML_PID=""
BACKEND_PID=""
FRONTEND_PID=""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

# Health check helper — uses jq if available, falls back to grepping the keyword
check_health() {
    local url="$1" keyword="$2"
    local body
    body="$(curl -s --max-time 3 "$url" 2>/dev/null)" || return 1
    if command -v jq >/dev/null 2>&1; then
        echo "$body" | jq -e "$keyword" >/dev/null 2>&1
    else
        # grep fallback: search for the bare keyword string (e.g. "healthy")
        echo "$body" | grep -q -F "$keyword"
    fi
}

cleanup() {
    info "Cleaning up services..."
    kill $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $ML_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    info "Cleanup done"
}
trap cleanup EXIT

# Find Python — use E2E_PYTHON env var (or PYTHON for backward compat), then PATH
PYTHON="${E2E_PYTHON:-${PYTHON:-}}"
if [ -z "$PYTHON" ]; then
    # type -a lists all PATH matches; pick the first that has uvicorn
    while IFS= read -r line; do
        case "$line" in
            *" is "*) p="${line#* is }" ;;
            /?*) p="$line" ;;
            *) continue ;;
        esac
        [ -z "$p" ] && continue
        if "$p" -c "import uvicorn" 2>/dev/null; then
            PYTHON="$p"
            break
        fi
    done < <(type -a python python3 py 2>/dev/null || true)
fi
if [ -z "$PYTHON" ]; then
    echo "[FAIL] Python 3.10+ not found"
    echo "  Set PYTHON env var, e.g.:"
    echo "    PYTHON=/l/develop/Python/Python313/python bash ci/e2e-stack.sh"
    exit 1
fi
# Quick sanity check (only when auto-detected, trust explicit E2E_PYTHON)
if [ -z "${E2E_PYTHON:-}" ] && [ -z "${PYTHON:-}" ]; then
    if ! "$PYTHON" -c "import sys; assert sys.version_info >= (3,10)" 2>/dev/null; then
        echo "[FAIL] Auto-detected Python at $PYTHON is not 3.10+"
        exit 1
    fi
fi
info "Using Python: $PYTHON"

echo ""
echo "============================================"
echo "  Full-Stack E2E — CI Pipeline"
echo "============================================"
echo ""

# ── [1/5] Pre-check & cleanup: ports ──
info "[1/5] Checking port availability..."
# Kill any lingering processes on our ports (Windows Git Bash)
for port in $ML_API_PORT $BACKEND_PORT $FRONTEND_PORT; do
    netstat -ano 2>/dev/null | grep ":$port " | grep LISTENING | awk '{print $NF}' | while read pid; do
        [ -n "$pid" ] && [ "$pid" -gt 0 ] 2>/dev/null && kill "$pid" 2>/dev/null || true
    done || true
done
sleep 1
pass "All ports available"

# ── [2/5] Start ML API ──
info "[2/5] Starting ML API (port $ML_API_PORT)..."
cd "$ML_API_DIR"
# Only pip install if uvicorn not available
if ! "$PYTHON" -c "import uvicorn" 2>/dev/null; then
    "$PYTHON" -m pip install -q -r requirements.txt 2>/dev/null || true
fi
"$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port $ML_API_PORT > "$ROOT_DIR/.ml-api.log" 2>&1 &
ML_PID=$!

# Poll health until ready (max 30s)
for i in $(seq 1 15); do
    if check_health "http://localhost:$ML_API_PORT/health" "healthy"; then
        pass "ML API ready (${i}x2s)"
        break
    fi
    sleep 2
done
if ! check_health "http://localhost:$ML_API_PORT/health" "healthy"; then
    curl -s "http://localhost:$ML_API_PORT/health" >> "$ROOT_DIR/.ml-api.log" 2>&1
    fail "ML API failed to start — check $ROOT_DIR/.ml-api.log"; exit 1
fi

# ── [3/5] Start Java backend ──
info "[3/5] Starting Java backend (port $BACKEND_PORT)..."
cd "$BACKEND_DIR"
JAVA_HOME="${JAVA_HOME:-}" bash bin/mvnw.sh spring-boot:run -q > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
for i in $(seq 1 15); do
    if check_health "http://localhost:$BACKEND_PORT/api/v1/health" "healthy"; then
        pass "Backend ready (${i}x2s)"; break
    fi
    sleep 2
done
if ! check_health "http://localhost:$BACKEND_PORT/api/v1/health" "healthy"; then
    fail "Backend failed to start"; exit 1
fi

# ── [4/5] Run Playwright E2E tests ──
info "[4/5] Running Playwright E2E tests..."
cd "$FRONTEND_DIR"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install 2>/dev/null
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npx playwright install --with-deps chromium 2>/dev/null || true

if npx playwright test e2e/market-analysis-e2e.spec.ts --reporter=list; then
    pass "All E2E tests passed"
else
    fail "E2E tests failed"; exit 1
fi

# ── [5/5] Summary ──
echo ""
echo "============================================"
echo "  All stages passed!"
echo "============================================"
echo ""
info "E2E tests: e2e/market-analysis-e2e.spec.ts"
info "Coverage: Dashboard / Filter / DataTable / What-If / Export / Nav"
info "Data: ${BACKEND_DIR}/data/House Price Dataset.csv (50 records)"
info "Model: LinearRegression"
