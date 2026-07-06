#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stop value-estimator-api process
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$Port = 8001
$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"

Write-Host "Stopping value-estimator-api..." -ForegroundColor Cyan

# Try PID file first
if (Test-Path $pidFile) {
    $state = Get-Content $pidFile | ConvertFrom-Json
    if ($state.estPid -gt 0) {
        Stop-Process -Id $state.estPid -Force -ErrorAction SilentlyContinue
        Write-Host "  Stopped PID $($state.estPid)" -ForegroundColor Gray
    }
}

# Fallback: kill anything on port
netstat -ano | Select-String ":$Port " | Select-String "LISTENING" | ForEach-Object {
    $p = ($_ -split '\s+')[-1]
    if ($p -match '^\d+$') { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Host "  Stopped PID $p on port $Port" -ForegroundColor Gray }
}

Write-Host "[PASS] value-estimator-api stopped" -ForegroundColor Green
