#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start price-prediction-api (:8000) Docker container
.DESCRIPTION
    Runs the pre-built Docker image. Use docker-build-prediction.ps1 to build first.
#>

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$CiDir = Join-Path $ProjectRoot "ci"

& (Join-Path $CiDir "docker-run-prediction.ps1") -Port 8000
if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) { exit 1 }
