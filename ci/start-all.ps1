#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start all 4 microservices for E2E testing
.DESCRIPTION
    Orchestrates startup by calling individual start-*.ps1 scripts:
      1. start-prediction.ps1  → price-prediction-api (:8000) via Docker
      2. start-estimator.ps1   → value-estimator-api  (:8001) via uvicorn
      3. start-market.ps1      → market-analysis-api  (:8002) via Maven
      4. start-portal.ps1      → prediction-portal    (:3001) via pnpm dev
.PARAMETER SkipBuild
    Skip Docker image build for price-prediction-api
#>

param([switch]$SkipBuild)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$CiDir = Join-Path $ProjectRoot "ci"

function Pass { Write-Host "[PASS] $args" -ForegroundColor Green }
function Fail { Write-Host "[FAIL] $args" -ForegroundColor Red; exit 1 }
function Info { Write-Host "[INFO] $args" -ForegroundColor Yellow }

# Port cleanup — skip Docker-mapped ports (handled by docker rm -f)
$ProcessPorts = @(8001, 8002, 3001)
Info "Checking port availability..."
# Only clean up non-Docker ports to avoid killing docker-proxy
foreach ($port in $ProcessPorts) {
    netstat -ano | Select-String ":$port " | Select-String "LISTENING" | ForEach-Object {
        $p = ($_ -split '\s+')[-1]
        if ($p -match '^\d+$') { 
            $processName = (Get-Process -Id $p -ErrorAction SilentlyContinue).ProcessName
            Info "Port $port in use by $processName (PID $p) — killed"
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep 1
Pass "All ports available"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  E2E Services - Startup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 1. price-prediction-api via Docker
if (-not $SkipBuild) {
    Info "Building Docker image..."
    & (Join-Path $CiDir "docker-build-prediction.ps1"); if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) { Fail "Docker build failed" }
}
& (Join-Path $CiDir "start-prediction.ps1"); if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) { Fail "price-prediction-api failed" }

# 2. value-estimator-api
& (Join-Path $CiDir "start-estimator.ps1"); if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) { Fail "value-estimator-api failed" }

# 3. market-analysis-api
& (Join-Path $CiDir "start-market.ps1"); if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) { Fail "market-analysis-api failed" }

# 4. prediction-portal
& (Join-Path $CiDir "start-portal.ps1"); if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) { Fail "prediction-portal failed" }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Services started successfully!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  price-prediction-api:  http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  value-estimator-api:   http://127.0.0.1:8001" -ForegroundColor White
Write-Host "  market-analysis-api:   http://127.0.0.1:8002" -ForegroundColor White
Write-Host "  prediction-portal:     http://127.0.0.1:3001" -ForegroundColor White
Write-Host ""
Info "Run '.\ci\stop-all.ps1' to stop all services"
