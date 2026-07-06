#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stop all microservices
.DESCRIPTION
    Stops all services by calling individual stop-*.ps1 scripts.
    Also performs fallback port cleanup.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$CiDir = Join-Path $ProjectRoot "ci"

function Info { Write-Host "[INFO] $args" -ForegroundColor Yellow }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  E2E Services - Shutdown" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Stop each service using individual scripts
& (Join-Path $CiDir "stop-prediction.ps1")
& (Join-Path $CiDir "stop-estimator.ps1")
& (Join-Path $CiDir "stop-market.ps1")
& (Join-Path $CiDir "stop-portal.ps1")

# Cleanup PID file
$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"
if (Test-Path $pidFile) { Remove-Item $pidFile -Force -ErrorAction SilentlyContinue; Info "Removed PID file" }

# Fallback: check non-Docker ports only (Docker handled by stop-prediction.ps1)
$ProcessPorts = @(8001, 8002, 3001)
Info "Checking ports for remaining processes..."
foreach ($port in $ProcessPorts) {
    netstat -ano | Select-String ":$port " | Select-String "LISTENING" | ForEach-Object {
        $p = ($_ -split '\s+')[-1]
        if ($p -match '^\d+$') { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Info "  Stopped PID $p on port $port" }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Services stopped successfully!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
