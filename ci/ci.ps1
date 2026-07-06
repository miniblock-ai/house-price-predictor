# ci.ps1 鈥?local CI: lint 鈫?test 鈫?build 鈫?e2e, one command
# Usage: .\ci\ci.ps1  (run from project root or from anywhere)

$ErrorActionPreference = "Stop"
$PROJECT_ROOT = Resolve-Path "$PSScriptRoot\.."
$SERVICE_DIR = "$PROJECT_ROOT\services\price-prediction-api"

function Pass { Write-Host "[PASS] $args" -ForegroundColor Green }
function Fail { Write-Host "[FAIL] $args" -ForegroundColor Red; exit 1 }

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Local CI - housing-price-api" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# [1/4] Static type check
Write-Host "[1/4] Running static type check (mypy)..." -ForegroundColor Yellow
Set-Location $SERVICE_DIR
try {
    python -m mypy app/
    Pass "Type check passed"
} catch {
    Fail "Type check failed - aborting"
}
Set-Location $PROJECT_ROOT
Write-Host ""

# [2/4] Unit + Integration tests
Write-Host "[2/4] Running unit/integration tests..." -ForegroundColor Yellow
Set-Location $SERVICE_DIR
try {
    python -m pytest tests/ --ignore tests/e2e -v
    Pass "All tests passed"
} catch {
    Fail "Tests failed - aborting before build"
}
Set-Location $PROJECT_ROOT
Write-Host ""

# [3/4] Build image
Write-Host "[3/4] Building image (lint+tests passed, proceed)..." -ForegroundColor Yellow
try {
    docker build -t $IMAGE_NAME $SERVICE_DIR
    Pass "Image built"
} catch {
    Fail "Docker build failed"
}
Write-Host ""

# [4/4] E2E tests
Write-Host "[4/4] Running E2E tests (using built image)..." -ForegroundColor Yellow
Set-Location $SERVICE_DIR
try {
    python -m pytest tests/e2e/ -v
    Pass "All E2E tests passed"
} catch {
    Fail "E2E tests failed"
}
Set-Location $PROJECT_ROOT
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  All stages passed!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"
