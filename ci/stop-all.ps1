# stop-all.ps1 — Stop all microservices
# Usage: .\ci\stop-all.ps1
#
# Reads PIDs from .e2e-pids.json (created by start-all.ps1)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$Ports = @(8000, 8001, 8002, 3001)

$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"

function Pass  { Write-Host "[PASS] $args" -ForegroundColor Green }
function Info  { Write-Host "[INFO] $args" -ForegroundColor Yellow }

function Stop-ServicePid ($id) {
    if ($id -gt 0) {
        Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
        Info "  Stopped PID $id"
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  E2E Services — Shutdown" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ════════════════════════════════════════════
#  Stop Docker containers
# ════════════════════════════════════════════
Info "Stopping Docker containers..."
docker rm -f price-prediction-api 2>$null

# ════════════════════════════════════════════
#  Stop from PID file
# ════════════════════════════════════════════
if (Test-Path $pidFile) {
    Info "Reading PIDs from $pidFile"
    $pids = Get-Content $pidFile | ConvertFrom-Json
    Stop-ServicePid $pids.predPid
    Stop-ServicePid $pids.estPid
    Stop-ServicePid $pids.marketPid
    Stop-ServicePid $pids.portalPid
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    Info "  Removed $pidFile"
}

# ════════════════════════════════════════════
#  Fallback: Port cleanup
# ════════════════════════════════════════════
Info "Checking ports for remaining processes..."
foreach ($port in $Ports) {
    netstat -ano | Select-String ":$port " | Select-String "LISTENING" | ForEach-Object {
        $p = ($_ -split '\s+')[-1]
        if ($p -match '^\d+$') {
            Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
            Info "  Stopped PID $p on port $port"
        }
    }
}

# ════════════════════════════════════════════
#  Cleanup log files
# ════════════════════════════════════════════
Info "Cleaning up log files..."
$logFiles = @(
    Join-Path $ProjectRoot ".price-prediction-api.log"
    Join-Path $ProjectRoot ".value-estimator-api.log"
    Join-Path $ProjectRoot ".market-analysis-api.log"
    Join-Path $ProjectRoot ".prediction-portal.log"
)
foreach ($f in $logFiles) {
    if (Test-Path $f) { Remove-Item $f -Force -ErrorAction SilentlyContinue }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Services stopped successfully!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
