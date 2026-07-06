#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start value-estimator-api (:8001) via uvicorn
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogDir = Join-Path $ProjectRoot ".log"
$null = New-Item -ItemType Directory -Force -Path $LogDir
$Log  = Join-Path $LogDir "value-estimator-api.log"
$Port = 8001

# Find Python
$python = if ($env:E2E_PYTHON) { $env:E2E_PYTHON } else { "" }
if (-not $python) {
    foreach ($name in @("python", "python3", "py")) {
        $p = (Get-Command $name -ErrorAction SilentlyContinue).Source
        if ($p) { & $p -c "import uvicorn" 2>$null; if ($LASTEXITCODE -eq 0) { $python = $p; break } }
    }
}
if (-not $python) { Write-Host "[FAIL] Python with uvicorn not found" -ForegroundColor Red; exit 1 }

$EstimatorDir = Join-Path $ProjectRoot "services/value-estimator-api"
Write-Host "Starting value-estimator-api (port $Port)..." -ForegroundColor Cyan

$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$python -m uvicorn app.main:app --host 127.0.0.1 --port $Port > `"$Log`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $EstimatorDir).Id
Start-Sleep 3

# Health check
$ready = $false; $lastError = ""
for ($i = 0; $i -lt 15; $i++) {
    try { $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/v1/health" -UseBasicParsing -TimeoutSec 5; if ($resp.StatusCode -eq 200) { $ready = $true; break } }
    catch { $lastError = $_.Exception.Message; Write-Host "  Health check $($i+1)/15: $lastError" -ForegroundColor Yellow }
    Start-Sleep 2
}
if (-not $ready) { Write-Host "[FAIL] value-estimator-api failed - check $Log" -ForegroundColor Red; exit 1 }

# Save PID
$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"
$state = if (Test-Path $pidFile) { Get-Content $pidFile | ConvertFrom-Json } else { @{} }
$state | Add-Member -NotePropertyName "estPid" -NotePropertyValue $processId -Force
$state | ConvertTo-Json | Set-Content $pidFile

Write-Host "[PASS] value-estimator-api ready at http://127.0.0.1:$Port (PID: $processId)" -ForegroundColor Green
