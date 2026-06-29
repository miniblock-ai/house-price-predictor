#!/usr/bin/env bash
# ci.sh — Java backend CI: compile → test (UT+CT) → coverage → report
# Usage: bash bin/ci.sh  (run from services/market-analysis-api/)

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() { echo -e "${GREEN}[PASS]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; exit 1; }

echo "============================================"
echo "  CI — Market Analysis API (Java)"
echo "============================================"
echo ""

# Find Maven wrapper
MVNW="bin/mvnw.sh"
if [ ! -f "$MVNW" ]; then
    # Running from backend dir, adjust path
    MVNW="./bin/mvnw.sh"
    if [ ! -f "$MVNW" ]; then
        fail "mvnw.sh not found. Run from services/market-analysis-api/"
    fi
fi

# ── [1/4] Compile ──
echo "[1/4] Compiling..."
if bash "$MVNW" compile -q; then
    pass "Compilation OK"
else
    fail "Compilation failed"
fi
echo ""

# ── [2/4] Unit Tests + Coverage ──
echo "[2/4] Running unit tests (with JaCoCo)..."
rm -f target/jacoco.exec
if bash "$MVNW" org.jacoco:jacoco-maven-plugin:0.8.12:prepare-agent test -q; then
    pass "UT: all tests passed"
else
    fail "UT failed"
fi
echo ""

# ── [3/4] Component Tests + Coverage (append) ──
echo "[3/4] Running component tests (with JaCoCo append)..."
if bash "$MVNW" org.jacoco:jacoco-maven-plugin:0.8.12:prepare-agent test -Pct -Djacoco.append=true -q; then
    pass "CT: all tests passed"
else
    fail "CT failed"
fi
echo ""

# ── [4/4] Coverage Report ──
echo "[4/4] Generating coverage report..."
if bash "$MVNW" org.jacoco:jacoco-maven-plugin:0.8.12:report -q; then
    # Parse overall coverage from CSV
    COVERAGE=$(python3 -c "
import csv
with open('target/site/jacoco/jacoco.csv') as f:
    total = covered = 0
    for r in csv.DictReader(f):
        total += int(r['LINE_MISSED']) + int(r['LINE_COVERED'])
        covered += int(r['LINE_COVERED'])
    print(f'{covered/total*100:.1f}')
" 2>/dev/null || python -c "
import csv
with open('target/site/jacoco/jacoco.csv') as f:
    total = covered = 0
    for r in csv.DictReader(f):
        total += int(r['LINE_MISSED']) + int(r['LINE_COVERED'])
        covered += int(r['LINE_COVERED'])
    print(f'{covered/total*100:.1f}')
")
    pass "Coverage: ${COVERAGE}% — report: target/site/jacoco/index.html"
else
    fail "Coverage report generation failed"
fi

echo ""
echo "============================================"
echo "  All CI stages passed!"
echo "============================================"
