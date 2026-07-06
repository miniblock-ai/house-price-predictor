#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Stop price-prediction-api Docker container
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$ContainerName = "price-prediction-api"
$Port = 8000

Write-Host "Stopping price-prediction-api (Docker: $ContainerName)..." -ForegroundColor Cyan

$oldPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker rm -f $ContainerName 2>$null
$exitCode = $LASTEXITCODE
$ErrorActionPreference = $oldPref

if ($exitCode -eq 0 -or $exitCode -eq 1) {
    Write-Host "[PASS] $ContainerName stopped" -ForegroundColor Green
} else {
    Write-Host "[WARN] $ContainerName may not have been running" -ForegroundColor Yellow
}

# Fallback: kill anything on port
netstat -ano | Select-String ":$Port " | Select-String "LISTENING" | ForEach-Object {
    $p = ($_ -split '\s+')[-1]
    if ($p -match '^\d+$') { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue; Write-Host "  Stopped PID $p on port $Port" -ForegroundColor Gray }
}
