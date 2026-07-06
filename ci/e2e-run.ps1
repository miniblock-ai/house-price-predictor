#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run Playwright E2E tests
.DESCRIPTION
    Runs Playwright E2E tests against running services on ports 8000/8002/3001.
.PARAMETER headed
    Run Playwright in headed mode (visible browser)
.PARAMETER demo
    Demo mode: headed + slow-mo 1000ms (simulates human click speed)
#>

param(
    [switch]$headed,
    [switch]$demo
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$PortalDir = Join-Path $ProjectRoot "frontend/apps/prediction-portal"

function Pass  { Write-Host "[PASS] $args" -ForegroundColor Green }
function Fail  { Write-Host "[FAIL] $args" -ForegroundColor Red; exit 1 }
function Info  { Write-Host "[INFO] $args" -ForegroundColor Yellow }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  E2E Tests - Playwright" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ════════════════════════════════════════════
#  Check services are running
# ════════════════════════════════════════════
Info "Checking services..."
$mlOk = $false; $bkOk = $false; $feOk = $false
try {
    $r1 = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 3
    if ($r1.Content -match 'healthy') { $mlOk = $true }
} catch {}
try {
    $r2 = Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/v1/health" -UseBasicParsing -TimeoutSec 3
    if ($r2.Content -match 'healthy') { $bkOk = $true }
} catch {}
try {
    $r3 = Invoke-WebRequest -Uri "http://127.0.0.1:3001" -UseBasicParsing -TimeoutSec 3
    if ($r3.StatusCode -eq 200) { $feOk = $true }
} catch {}

if (-not $mlOk) { Fail "ML API not running on port 8000. Run '.\ci\start-all.ps1' first." }
if (-not $bkOk) { Fail "Backend not running on port 8002. Run '.\ci\start-all.ps1' first." }
if (-not $feOk) { Fail "Frontend not running on port 3001. Run '.\ci\start-all.ps1' first." }
Pass "Services are running"

# ════════════════════════════════════════════
#  Run Playwright
# ════════════════════════════════════════════
Info "Running Playwright E2E tests..."
$testPath = "e2e/app2/market-analysis-e2e.spec.ts"
$testFullPath = Join-Path $PortalDir $testPath
if (-not (Test-Path $testFullPath)) {
    Fail "Test file not found: $testFullPath"
}

Push-Location $PortalDir
try {
    if ($demo) {
        Info "DEMO mode (headed + slow-mo 1000ms)"
        $env:PLAYWRIGHT_SLOW_MO = "1000"
        npx playwright test $testPath --reporter=list --headed
        Remove-Item Env:PLAYWRIGHT_SLOW_MO
    } elseif ($headed) {
        Info "HEADED mode (browser visible)"
        npx playwright test $testPath --reporter=list --headed
    } else {
        Info "HEADLESS mode"
        npx playwright test $testPath --reporter=list
    }
    if ($LASTEXITCODE -ne 0) { Fail "E2E tests failed" }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  All E2E tests passed!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
