#!/usr/bin/env bash
#
# stop-all.sh — Stop all microservices
#
# Usage: ./ci/stop-all.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

PASS() { echo -e "\e[32m[PASS]\e[0m $*"; }
INFO() { echo -e "\e[33m[INFO]\e[0m $*"; }

echo ""
echo "============================================"
echo "  E2E Services - Shutdown"
echo "============================================"
echo ""

# Stop Docker container
INFO "Stopping price-prediction-api (Docker)..."
docker rm -f price-prediction-api 2>/dev/null || true
PASS "price-prediction-api stopped"

# Read PID file and stop processes
PID_FILE="$PROJECT_ROOT/.e2e-pids.json"
if [ -f "$PID_FILE" ]; then
    EST_PID=$(python3 -c "import json; print(json.load(open('$PID_FILE')).get('estPid', 0))" 2>/dev/null || echo 0)
    MARKET_PID=$(python3 -c "import json; print(json.load(open('$PID_FILE')).get('marketPid', 0))" 2>/dev/null || echo 0)
    PORTAL_PID=$(python3 -c "import json; print(json.load(open('$PID_FILE')).get('portalPid', 0))" 2>/dev/null || echo 0)

    [ "$EST_PID" -gt 0 ] && { kill -9 "$EST_PID" 2>/dev/null || true; INFO "  Stopped value-estimator-api (PID $EST_PID)"; }
    [ "$MARKET_PID" -gt 0 ] && { kill -9 "$MARKET_PID" 2>/dev/null || true; INFO "  Stopped market-analysis-api (PID $MARKET_PID)"; }
    [ "$PORTAL_PID" -gt 0 ] && { kill -9 "$PORTAL_PID" 2>/dev/null || true; INFO "  Stopped prediction-portal (PID $PORTAL_PID)"; }

    rm -f "$PID_FILE"
    INFO "Removed PID file"
fi

# Fallback: port-based cleanup (skip Docker port 8000)
INFO "Checking ports for remaining processes..."
for port in 8001 8002 3001; do
    if command -v lsof &>/dev/null; then
        lsof -ti :"$port" 2>/dev/null | xargs -r kill -9 2>/dev/null || true
    elif command -v fuser &>/dev/null; then
        fuser -k "$port/tcp" 2>/dev/null || true
    fi
done

echo ""
echo "============================================"
echo "  Services stopped successfully!"
echo "============================================"
echo ""
