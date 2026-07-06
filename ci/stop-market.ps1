#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stop market-analysis-api process
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$Port = 8002
$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"

Write-Host "Stopping market-analysis-api..." -ForegroundColor Cyan

# Try PID file first
if (Test-Path $pidFile) {
    $state = Get-Content $pidFile | ConvertFrom-Json
    if ($state.marketPid -gt 0) {
        Stop-Process -Id $state.marketPid -Force -ErrorAction SilentlyContinue
        Write-Host "  Stopped PID $($state.marketPid)" -ForegroundColor Gray
    }
}

# Fallback: kill anything on port
netstat -ano | Select-String ":$Port " | Select-String "LISTENING" | ForEach-Object {
    $p = ($_ -split '\s+')[-1]
    if ($p -match '^\d+$') { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Host "  Stopped PID $p on port $Port" -ForegroundColor Gray }
}

Write-Host "[PASS] market-analysis-api stopped" -ForegroundColor Green
