#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start prediction-portal (:3001) via pnpm dev
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$LogDir = Join-Path $ProjectRoot ".log"
$null = New-Item -ItemType Directory -Force -Path $LogDir
$Log  = Join-Path $LogDir "prediction-portal.log"
$Port = 3001

$PortalDir = Join-Path $ProjectRoot "frontend/apps/prediction-portal"
$pnpm = (Get-Command pnpm -ErrorAction SilentlyContinue).Source
if (-not $pnpm) { Write-Host "[FAIL] pnpm not found in PATH" -ForegroundColor Red; exit 1 }

Write-Host "Starting prediction-portal (port $Port)..." -ForegroundColor Cyan

$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"pnpm dev --prefer-offline -p $Port > `"$Log`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $PortalDir).Id
Start-Sleep 3

# Phase 1: Wait for port LISTENING (up to ~60s, pnpm resolution can be slow)
$ready = $false; $lastError = ""
for ($i = 0; $i -lt 30; $i++) {
    $listening = netstat -ano | Select-String ":$Port " | Select-String "LISTENING"
    if ($listening) { $ready = $true; break }
    Start-Sleep 2
}
if (-not $ready) { Write-Host "[FAIL] prediction-portal never opened port $Port - check $Log" -ForegroundColor Red; exit 1 }

# Phase 2: Wait for HTTP 200
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    try { $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/health" -UseBasicParsing -TimeoutSec 5; if ($resp.StatusCode -eq 200) { $ready = $true; break } }
    catch {
        try { $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$Port" -UseBasicParsing -TimeoutSec 5; if ($resp.StatusCode -eq 200) { $ready = $true; break } }
        catch { $lastError = $_.Exception.Message; Write-Host "  Health check $($i+1)/15: $lastError" -ForegroundColor Yellow }
    }
    Start-Sleep 2
}
if (-not $ready) { Write-Host "[FAIL] prediction-portal failed - last error: $lastError - check $Log" -ForegroundColor Red; exit 1 }

# Save PID
$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"
$state = if (Test-Path $pidFile) { Get-Content $pidFile | ConvertFrom-Json } else { @{} }
$state | Add-Member -NotePropertyName "portalPid" -NotePropertyValue $processId -Force
$state | ConvertTo-Json | Set-Content $pidFile

Write-Host "[PASS] prediction-portal ready at http://127.0.0.1:$Port (PID: $processId)" -ForegroundColor Green
