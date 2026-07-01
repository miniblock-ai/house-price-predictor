#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Build Docker image for price-prediction-api
.DESCRIPTION
    Builds the Docker image for the ML prediction API service.
    The image is tagged as 'price-prediction-api:latest'.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$ImageName = "price-prediction-api"
$BuildDir  = Join-Path $ProjectRoot "services/price-prediction-api"
$LogDir    = Join-Path $ProjectRoot ".log"
$null = New-Item -ItemType Directory -Force -Path $LogDir
$BuildLog  = Join-Path $LogDir "docker-build.log"

Write-Host "Building Docker image: $ImageName" -ForegroundColor Cyan
Write-Host "  Context: $BuildDir" -ForegroundColor Gray

$oldPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker build -t $ImageName $BuildDir 2>$BuildLog
$exitCode = $LASTEXITCODE
$ErrorActionPreference = $oldPref

if ($exitCode -ne 0) {
    Write-Host "[FAIL] Docker build failed — check $BuildLog" -ForegroundColor Red
    exit 1
}

Write-Host "[PASS] Docker image built: $ImageName" -ForegroundColor Green
