#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start market-analysis-api (:8002) via Maven spring-boot:run
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogDir = Join-Path $ProjectRoot ".log"
$null = New-Item -ItemType Directory -Force -Path $LogDir
$Log  = Join-Path $LogDir "market-analysis-api.log"
$Port = 8002

$MarketDir = Join-Path $ProjectRoot "services/market-analysis-api"
$mvn = (Get-Command mvn.cmd -ErrorAction SilentlyContinue).Source
if (-not $mvn) { Write-Host "[FAIL] mvn.cmd not found in PATH" -ForegroundColor Red; exit 1 }

Write-Host "Starting market-analysis-api (port $Port)..." -ForegroundColor Cyan

$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$mvn spring-boot:run -q > `"$Log`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $MarketDir).Id
Start-Sleep 5

# Health check
$ready = $false; $lastError = ""
for ($i = 0; $i -lt 20; $i++) {
    try { $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/v1/health" -UseBasicParsing -TimeoutSec 5; if ($resp.Content -match 'healthy') { $ready = $true; break } }
    catch { $lastError = $_.Exception.Message; Write-Host "  Health check $($i+1)/20: $lastError" -ForegroundColor Yellow }
    Start-Sleep 3
}
if (-not $ready) { Write-Host "[FAIL] market-analysis-api failed - check $Log" -ForegroundColor Red; exit 1 }

# Save PID
$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"
$state = if (Test-Path $pidFile) { Get-Content $pidFile | ConvertFrom-Json } else { @{} }
$state | Add-Member -NotePropertyName "marketPid" -NotePropertyValue $processId -Force
$state | ConvertTo-Json | Set-Content $pidFile

Write-Host "[PASS] market-analysis-api ready at http://127.0.0.1:$Port (PID: $processId)" -ForegroundColor Green
