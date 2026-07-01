#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start all 4 microservices for E2E testing
.DESCRIPTION
    Orchestrates startup of:
      1. price-prediction-api (:8000) — Docker container
      2. value-estimator-api  (:8001) — uvicorn process
      3. market-analysis-api  (:8002) — Maven spring-boot:run
      4. prediction-portal    (:3001) — pnpm dev
.PARAMETER SkipBuild
    Skip Docker build and use existing image
#>

param([switch]$SkipBuild)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$CiDir       = Join-Path $ProjectRoot "ci"

# Ports
$PredictionPort     = 8000
$EstimatorPort      = 8001
$MarketAnalysisPort = 8002
$PortalPort         = 3001

# Health check config
$HealthCheckTimeoutSec = 10

# Log files
$LogDir  = Join-Path $ProjectRoot ".log"
$null = New-Item -ItemType Directory -Force -Path $LogDir
$EstimatorLog      = Join-Path $LogDir "value-estimator-api.log"
$MarketAnalysisLog = Join-Path $LogDir "market-analysis-api.log"
$PortalLog         = Join-Path $LogDir "prediction-portal.log"

$estPid = 0; $marketPid = 0; $portalPid = 0

function Pass  { Write-Host "[PASS] $args" -ForegroundColor Green }
function Fail  { Write-Host "[FAIL] $args" -ForegroundColor Red; exit 1 }
function Info  { Write-Host "[INFO] $args" -ForegroundColor Yellow }

function Stop-ServicePid ($id) {
    if ($id -gt 0) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
}

try {

# ════════════════════════════════════════════
#  Find Python
# ════════════════════════════════════════════
$python = if ($env:E2E_PYTHON) { $env:E2E_PYTHON } else { "" }
if (-not $python) {
    foreach ($name in @("python", "python3", "py")) {
        $p = (Get-Command $name -ErrorAction SilentlyContinue).Source
        if ($p) {
            & $p -c "import uvicorn" 2>$null
            if ($LASTEXITCODE -eq 0) { $python = $p; break }
        }
    }
}
if (-not $python) { Fail "Python 3.10+ (with uvicorn) not found. Set E2E_PYTHON env var." }
Info "Using Python: $python"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  E2E Services - Startup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ════════════════════════════════════════════
#  Port cleanup
# ════════════════════════════════════════════
Info "Checking port availability..."
foreach ($port in @($PredictionPort, $EstimatorPort, $MarketAnalysisPort, $PortalPort)) {
    netstat -ano | Select-String ":$port " | Select-String "LISTENING" | ForEach-Object {
        $p = ($_ -split '\s+')[-1]
        if ($p -match '^\d+$') { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }
    }
}
Start-Sleep 1
Pass "All ports available"

# ════════════════════════════════════════════
#  1. price-prediction-api (:8000) via Docker
# ════════════════════════════════════════════
if (-not $SkipBuild) {
    Info "Building Docker image for price-prediction-api..."
    & (Join-Path $CiDir "docker-build-prediction.ps1")
}

Info "Starting Docker container for price-prediction-api..."
& (Join-Path $CiDir "docker-run-prediction.ps1") -Port $PredictionPort
Pass "price-prediction-api ready"

# ════════════════════════════════════════════
#  2. value-estimator-api (:8001)
# ════════════════════════════════════════════
$EstimatorDir = Join-Path $ProjectRoot "services/value-estimator-api"
Info "Starting value-estimator-api (port $EstimatorPort)..."
$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$python -m uvicorn app.main:app --host 127.0.0.1 --port $EstimatorPort > `"$EstimatorLog`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $EstimatorDir).Id
$estPid = $processId
Start-Sleep 3

$estReady = $false
$estLastError = ""
for ($i = 0; $i -lt 15; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$EstimatorPort/api/v1/health" -UseBasicParsing -TimeoutSec $HealthCheckTimeoutSec
        if ($resp.StatusCode -eq 200) { $estReady = $true; break }
    } catch {
        $estLastError = $_.Exception.Message
        Info "  Health check $($i+1)/15 failed: $estLastError"
    }
    Start-Sleep 2
}
if (-not $estReady) { Fail "value-estimator-api failed - last error: $estLastError - check $EstimatorLog" }
Pass "value-estimator-api ready (PID: $estPid)"

# ════════════════════════════════════════════
#  3. market-analysis-api (:8002)
# ════════════════════════════════════════════
$MarketAnalysisDir = Join-Path $ProjectRoot "services/market-analysis-api"
$mvn = (Get-Command mvn.cmd -ErrorAction SilentlyContinue).Source
if (-not $mvn) { Fail "mvn.cmd not found in PATH. Ensure Maven is installed." }

Info "Starting market-analysis-api (port $MarketAnalysisPort)..."
$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$mvn spring-boot:run -q > `"$MarketAnalysisLog`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $MarketAnalysisDir).Id
$marketPid = $processId
Start-Sleep 5

$marketReady = $false
$marketLastError = ""
for ($i = 0; $i -lt 20; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$MarketAnalysisPort/api/v1/health" -UseBasicParsing -TimeoutSec $HealthCheckTimeoutSec
        if ($resp.Content -match 'healthy') { $marketReady = $true; break }
    } catch {
        $marketLastError = $_.Exception.Message
        Info "  Health check $($i+1)/20 failed: $marketLastError"
    }
    Start-Sleep 3
}
if (-not $marketReady) { Fail "market-analysis-api failed - last error: $marketLastError - check $MarketAnalysisLog" }
Pass "market-analysis-api ready (PID: $marketPid)"

# ════════════════════════════════════════════
#  4. prediction-portal (:3001)
# ════════════════════════════════════════════
$PortalDir = Join-Path $ProjectRoot "frontend/apps/prediction-portal"
$pnpm = (Get-Command pnpm -ErrorAction SilentlyContinue).Source
if (-not $pnpm) { Fail "pnpm not found in PATH. Ensure pnpm is installed." }

Info "Starting prediction-portal (port $PortalPort)..."
$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"pnpm dev -p $PortalPort > `"$PortalLog`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $PortalDir).Id
$portalPid = $processId
Start-Sleep 3

# Phase 1: Wait for port LISTENING
$portalReady = $false
$portalLastError = ""
for ($i = 0; $i -lt 15; $i++) {
    $listening = netstat -ano | Select-String ":3001 " | Select-String "LISTENING"
    if ($listening) { $portalReady = $true; break }
    Start-Sleep 2
}
if (-not $portalReady) { Fail "prediction-portal never opened port 3001 - check $PortalLog" }

# Phase 2: Wait for HTTP 200
$portalReady = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$PortalPort/api/health" -UseBasicParsing -TimeoutSec $HealthCheckTimeoutSec
        if ($resp.StatusCode -eq 200) { $portalReady = $true; break }
    } catch {
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$PortalPort" -UseBasicParsing -TimeoutSec $HealthCheckTimeoutSec
            if ($resp.StatusCode -eq 200) { $portalReady = $true; break }
        } catch {
            $portalLastError = $_.Exception.Message
            Info "  Health check $($i+1)/15 failed: $portalLastError"
        }
    }
    Start-Sleep 2
}
if (-not $portalReady) { Fail "prediction-portal failed - last error: $portalLastError - check $PortalLog" }
Pass "prediction-portal ready (PID: $portalPid)"

# ════════════════════════════════════════════
#  Output PIDs
# ════════════════════════════════════════════
$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"
@{ predPid = 0; estPid = $estPid; marketPid = $marketPid; portalPid = $portalPid } | ConvertTo-Json | Set-Content $pidFile
Info "PIDs saved to $pidFile"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Services started successfully!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
  Write-Host "  price-prediction-api:  http://127.0.0.1:$PredictionPort"
  Write-Host "  value-estimator-api:   http://127.0.0.1:$EstimatorPort"
  Write-Host "  market-analysis-api:   http://127.0.0.1:$MarketAnalysisPort"
  Write-Host "  prediction-portal:     http://127.0.0.1:$PortalPort"
Write-Host ""
Info "Run '.\ci\e2e-run.ps1' to execute tests"
Info "Run '.\ci\stop-all.ps1' to stop services"

} catch {
    Fail "Startup failed: $($_.Exception.Message)"
    Stop-ServicePid $estPid
    Stop-ServicePid $marketPid
    Stop-ServicePid $portalPid
    exit 1
}
