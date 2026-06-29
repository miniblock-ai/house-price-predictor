#!/usr/bin/env bash
# ci.sh — local CI: lint → test → build → e2e, one command
# Usage: bash ci/ci.sh  (run from project root)

set -euo pipefail

IMAGE_NAME="housing-price-api"
SERVICE_DIR="services/housing-price-prediction"

# Find Python — try candidates and pick the first one that actually works
PYTHON=""
for cmd in python python3 py py3; do
    if command -v "$cmd" >/dev/null 2>&1; then
        candidate="$(command -v "$cmd")"
        # Skip non-usable Pythons
        case "$candidate" in
            *WindowsApps*) continue ;;
            /usr/bin/python*) continue ;;  # MSYS2 internal Python, no deps
        esac
        # Verify it actually runs
        if "$candidate" -c "import sys; assert sys.version_info >= (3,10)" 2>/dev/null; then
            PYTHON="$candidate"
            break
        fi
    fi
done
# Fallback: search common Windows install locations
if [ -z "$PYTHON" ]; then
    for dir in /l/develop/Python/Python313 /c/Python313 "/c/Program Files/Python313" "/c/Program Files (x86)/Python313-32" "/c/Users/$(whoami)/AppData/Local/Programs/Python/Python313"; do
        candidate="$dir/python.exe"
        if [ -x "$candidate" ]; then
            if "$candidate" -c "import sys; assert sys.version_info >= (3,10)" 2>/dev/null; then
                PYTHON="$candidate"
                break
            fi
        fi
    done
fi
if [ -z "$PYTHON" ]; then
    echo "Error: Python not found"
    echo "Install: https://www.python.org/downloads/"
    exit 1
fi
echo "  Python: $PYTHON"

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

echo "============================================"
echo "  Local CI — $IMAGE_NAME"
echo "============================================"
echo ""

# ── [0] Install dev deps ──
echo "[0/4] Installing dev dependencies (mypy)..."
"$PYTHON" -m pip install -q mypy 2>/dev/null || true
echo ""

# ── [1/4] Static type check (no image needed) ──
echo "[1/4] Running static type check (mypy)..."
cd "$SERVICE_DIR"
if "$PYTHON" -m mypy app/; then
    pass "Type check passed"
else
    fail "Type check failed — aborting"
fi
cd - > /dev/null
echo ""

# ── [2/4] Unit + Integration tests (no image needed) ──
echo "[2/4] Running unit/integration tests..."
cd "$SERVICE_DIR"
if "$PYTHON" -m pytest tests/ --ignore tests/e2e -v; then
    pass "All tests passed"
else
    fail "Tests failed — aborting before build"
fi
cd - > /dev/null
echo ""

# ── [3/4] Build image ──
echo "[3/4] Building image (lint+tests passed, proceed)..."
if docker build -t "$IMAGE_NAME" "$SERVICE_DIR"; then
    pass "Image built"
else
    fail "Docker build failed"
fi
echo ""

# ── [4/4] E2E tests (need built image) ──
echo "[4/4] Running E2E tests (using built image)..."
cd "$SERVICE_DIR"
if "$PYTHON" -m pytest tests/e2e/ -v; then
    pass "All E2E tests passed"
fi
cd - > /dev/null

echo ""
echo "============================================"
echo "  All stages passed!"
echo "============================================"
