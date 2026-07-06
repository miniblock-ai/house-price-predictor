#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stop prediction-portal process
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$Port = 3001
$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"

Write-Host "Stopping prediction-portal..." -ForegroundColor Cyan

# Try PID file first
if (Test-Path $pidFile) {
    $state = Get-Content $pidFile | ConvertFrom-Json
    if ($state.portalPid -gt 0) {
        Stop-Process -Id $state.portalPid -Force -ErrorAction SilentlyContinue
        Write-Host "  Stopped PID $($state.portalPid)" -ForegroundColor Gray
    }
}

# Fallback: kill anything on port
netstat -ano | Select-String ":$Port " | Select-String "LISTENING" | ForEach-Object {
    $p = ($_ -split '\s+')[-1]
    if ($p -match '^\d+$') { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Host "  Stopped PID $p on port $Port" -ForegroundColor Gray }
}

Write-Host "[PASS] prediction-portal stopped" -ForegroundColor Green
