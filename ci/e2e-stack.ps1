# e2e-stack.ps1 — Full-stack E2E: start services, run tests, stop services
# Usage: .\ci\e2e-stack.ps1 [--headed] [--demo]
#
# Parameters:
#   --headed    Run Playwright in headed mode (visible browser)
#   --demo      Demo mode: headed + slow-mo 500ms (simulates human click speed)
#
# This script orchestrates:
#   1. e2e-start.ps1 — Start ML API and Backend
#   2. e2e-run.ps1    — Run Playwright tests
#   3. e2e-stop.ps1   — Stop services

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Parse --headed / --demo from $args
$Headed = $false
$Demo = $false
foreach ($arg in $args) {
    switch ($arg) {
        "--headed" { $Headed = $true }
        "--demo"   { $Demo = $true }
        default    { Write-Host "[WARN] Unknown argument: $arg" -ForegroundColor Yellow }
    }
}

function Fail { Write-Host "[FAIL] $args" -ForegroundColor Red; exit 1 }
function Info { Write-Host "[INFO] $args" -ForegroundColor Yellow }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Full-Stack E2E — CI Pipeline" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

try {
    # 1. Start services
    Info "[1/3] Starting services..."
    & "$ScriptDir\e2e-start.ps1"
    if ($LASTEXITCODE -ne 0) { Fail "Failed to start services" }

    # 2. Run tests
    Info "[2/3] Running E2E tests..."
    if ($Demo) {
        & "$ScriptDir\e2e-run.ps1" --demo
    } elseif ($Headed) {
        & "$ScriptDir\e2e-run.ps1" --headed
    } else {
        & "$ScriptDir\e2e-run.ps1"
    }
    if ($LASTEXITCODE -ne 0) { Fail "E2E tests failed" }

    # 3. Stop services
    Info "[3/3] Stopping services..."
    & "$ScriptDir\e2e-stop.ps1"

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  All stages passed!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""

} catch {
    Fail "Pipeline failed: $($_.Exception.Message)"
} finally {
    # Ensure cleanup on any failure
    if (Test-Path "$ScriptDir\e2e-stop.ps1") {
        & "$ScriptDir\e2e-stop.ps1"
    }
}