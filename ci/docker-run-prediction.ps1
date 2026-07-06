#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Run Docker container for price-prediction-api
.DESCRIPTION
    Starts the price-prediction-api Docker container.
    Removes any existing container with the same name first.
    Port mapping: host 8000 → container 8000
.PARAMETER Port
    Host port to map (default: 8000)
#>

param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$ImageName = "price-prediction-api"
$ContainerName = "price-prediction-api"
$LogDir    = Join-Path $ProjectRoot ".log"
$null = New-Item -ItemType Directory -Force -Path $LogDir
$StdLog    = Join-Path $LogDir "price-prediction-api.log"
$ErrLog    = Join-Path $LogDir "price-prediction-api.err.log"

Write-Host "Starting Docker container: $ContainerName (port $Port)" -ForegroundColor Cyan

# Check Docker is running (no pipe to preserve $LASTEXITCODE)
docker info 2>$null >$null
if ($LASTEXITCODE -ne 0) {
    $dockerErr = docker info 2>&1 | Out-String
    if ($dockerErr -match "cannot connect|daemon|pipe|npipe") {
        Write-Host "[FAIL] Docker Desktop is not running. Please start Docker Desktop first." -ForegroundColor Red
    } else {
        Write-Host "[FAIL] Docker is not available: $dockerErr" -ForegroundColor Red
    }
    exit 1
}

# Remove existing container if any
$oldPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
docker rm -f $ContainerName 2>$null
$ErrorActionPreference = $oldPref

# Run container (detached)
$processId = (Start-Process -FilePath "docker" -ArgumentList "run -d --name $ContainerName -p ${Port}:8000 $ImageName" -PassThru -WindowStyle Hidden -RedirectStandardOutput $StdLog -RedirectStandardError $ErrLog).Id

Write-Host "  Container PID: $processId" -ForegroundColor Gray

# Health check
$ready = $false
$lastError = ""
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep 2
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/health" -UseBasicParsing -TimeoutSec 5
        if ($resp.Content -match 'healthy') { $ready = $true; break }
    } catch {
        $lastError = $_.Exception.Message
        Write-Host "  Health check $($i+1)/15: $lastError" -ForegroundColor Yellow
    }
}

if (-not $ready) {
    Write-Host "[FAIL] Container failed to start — check $StdLog / $ErrLog" -ForegroundColor Red
    exit 1
}

Write-Host "[PASS] $ContainerName ready at http://127.0.0.1:$Port" -ForegroundColor Green
