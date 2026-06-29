# start-all.ps1 — Start all 4 microservices for E2E testing
# Usage: .\ci\start-all.ps1
#
# Prerequisites:
#   - Python 3.10+ with pip (set E2E_PYTHON env var or auto-detect)
#   - JDK 21+ with JAVA_HOME set
#   - Maven in PATH (mvn.cmd)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

# Service directories (matching architecture doc naming)
$PredictionDir     = Join-Path $ProjectRoot "services/price-prediction-api"
$EstimatorDir      = Join-Path $ProjectRoot "services/value-estimator-api"
$MarketAnalysisDir = Join-Path $ProjectRoot "services/market-analysis-api"
$PortalDir         = Join-Path $ProjectRoot "frontend/apps/prediction-portal"

# Ports
$PredictionPort     = 8000  # price-prediction-api (ML inference)
$EstimatorPort      = 8001  # value-estimator-api (App 1 backend)
$MarketAnalysisPort = 8002  # market-analysis-api (App 2 backend)
$PortalPort         = 3001  # prediction-portal (Next.js)

# Health check config (industry standard: 5-10s)
$HealthCheckTimeoutSec = 10

# Log files (combined stdout+stderr) — placed in .log/ to keep root clean
$LogDir             = Join-Path $ProjectRoot ".log"
$null = New-Item -ItemType Directory -Force -Path $LogDir
$PredictionLog     = Join-Path $LogDir "price-prediction-api.log"
$EstimatorLog      = Join-Path $LogDir "value-estimator-api.log"
$MarketAnalysisLog = Join-Path $LogDir "market-analysis-api.log"
$PortalLog         = Join-Path $LogDir "prediction-portal.log"

$predPid = 0; $estPid = 0; $marketPid = 0; $portalPid = 0

function Pass  { Write-Host "[PASS] $args" -ForegroundColor Green }
function Fail  { Write-Host "[FAIL] $args" -ForegroundColor Red; exit 1 }
function Info  { Write-Host "[INFO] $args" -ForegroundColor Yellow }

function Stop-ServicePid ($id) {
    if ($id -gt 0) { Stop-Process -Id $id -Force -ErrorAction SilentlyContinue }
}

try {

# ════════════════════════════════════════════
#  Find Python
# ════════════════════════════════════════════
$python = if ($env:E2E_PYTHON) { $env:E2E_PYTHON } else { "" }
if (-not $python) {
    foreach ($name in @("python", "python3", "py")) {
        $p = (Get-Command $name -ErrorAction SilentlyContinue).Source
        if ($p) {
            & $p -c "import uvicorn" 2>$null
            if ($LASTEXITCODE -eq 0) { $python = $p; break }
        }
    }
}
if (-not $python) { Fail "Python 3.10+ (with uvicorn) not found. Set E2E_PYTHON env var." }
Info "Using Python: $python"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  E2E Services — Startup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# ════════════════════════════════════════════
#  Port cleanup
# ════════════════════════════════════════════
Info "Checking port availability..."
foreach ($port in @($PredictionPort, $EstimatorPort, $MarketAnalysisPort, $PortalPort)) {
    netstat -ano | Select-String ":$port " | Select-String "LISTENING" | ForEach-Object {
        $p = ($_ -split '\s+')[-1]
        if ($p -match '^\d+$') { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }
    }
}
Start-Sleep 1
Pass "All ports available"

# ════════════════════════════════════════════
#  1. Start price-prediction-api (:8000)
# ════════════════════════════════════════════
Info "Starting price-prediction-api (port $PredictionPort)..."
& $python -c "import uvicorn" 2>$null
if ($LASTEXITCODE -ne 0) { & $python -m pip install -q -r (Join-Path $PredictionDir "requirements.txt") 2>$null }

$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$python -m uvicorn app.main:app --host 127.0.0.1 --port $PredictionPort > `"$PredictionLog`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $PredictionDir).Id
$predPid = $processId
Info "  price-prediction-api process started (PID: $predPid)"
Start-Sleep 3

$predReady = $false
$predLastError = ""
for ($i = 0; $i -lt 15; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$PredictionPort/health" -UseBasicParsing -TimeoutSec $HealthCheckTimeoutSec
        if ($resp.Content -match 'healthy') { $predReady = $true; break }
    } catch {
        $predLastError = $_.Exception.Message
        Info "  Health check attempt $($i+1)/15 failed: $predLastError"
    }
    Start-Sleep 2
}
if (-not $predReady) { Fail "price-prediction-api failed to start — last error: $predLastError — check $PredictionLog" }
Pass "price-prediction-api ready (PID: $predPid)"

# ════════════════════════════════════════════
#  2. Start value-estimator-api (:8001)
# ════════════════════════════════════════════
Info "Starting value-estimator-api (port $EstimatorPort)..."

$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$python -m uvicorn app.main:app --host 127.0.0.1 --port $EstimatorPort > `"$EstimatorLog`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $EstimatorDir).Id
$estPid = $processId
Info "  value-estimator-api process started (PID: $estPid)"
Start-Sleep 3

$estReady = $false
$estLastError = ""
for ($i = 0; $i -lt 15; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$EstimatorPort/api/v1/health" -UseBasicParsing -TimeoutSec $HealthCheckTimeoutSec
        if ($resp.StatusCode -eq 200) { $estReady = $true; break }
    } catch {
        $estLastError = $_.Exception.Message
        Info "  Health check attempt $($i+1)/15 failed: $estLastError"
    }
    Start-Sleep 2
}
if (-not $estReady) { Fail "value-estimator-api failed to start — last error: $estLastError — check $EstimatorLog" }
Pass "value-estimator-api ready (PID: $estPid)"

# ════════════════════════════════════════════
#  3. Start market-analysis-api (:8002)
# ════════════════════════════════════════════
Info "Starting market-analysis-api (port $MarketAnalysisPort)..."

$mvn = (Get-Command mvn.cmd -ErrorAction SilentlyContinue).Source
if (-not $mvn) { Fail "mvn.cmd not found in PATH. Ensure Maven is installed and in PATH." }

$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"$mvn spring-boot:run -q > `"$MarketAnalysisLog`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $MarketAnalysisDir).Id
$marketPid = $processId
Info "  market-analysis-api process started (PID: $marketPid)"
Start-Sleep 5

$marketReady = $false
$marketLastError = ""
for ($i = 0; $i -lt 20; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$MarketAnalysisPort/api/v1/health" -UseBasicParsing -TimeoutSec $HealthCheckTimeoutSec
        if ($resp.Content -match 'healthy') { $marketReady = $true; break }
    } catch {
        $marketLastError = $_.Exception.Message
        Info "  Health check attempt $($i+1)/20 failed: $marketLastError"
    }
    Start-Sleep 3
}
if (-not $marketReady) { Fail "market-analysis-api failed to start — last error: $marketLastError — check $MarketAnalysisLog" }
Pass "market-analysis-api ready (PID: $marketPid)"

# ════════════════════════════════════════════
#  4. Start prediction-portal (:3001)
# ════════════════════════════════════════════
Info "Starting prediction-portal (port $PortalPort)..."

$pnpm = (Get-Command pnpm -ErrorAction SilentlyContinue).Source
if (-not $pnpm) { Fail "pnpm not found in PATH. Ensure pnpm is installed." }

$processId = (Start-Process -FilePath "cmd.exe" -ArgumentList "/c `"pnpm dev -p $PortalPort > `"$PortalLog`" 2>&1`"" -PassThru -WindowStyle Hidden -WorkingDirectory $PortalDir).Id
$portalPid = $processId
Info "  prediction-portal process started (PID: $portalPid)"
Start-Sleep 3

# Phase 1: Wait for port to start LISTENING (fast check, Next.js opens port quickly)
$portalReady = $false
$portalLastError = ""
for ($i = 0; $i -lt 15; $i++) {
    $listening = netstat -ano | Select-String ":3001 " | Select-String "LISTENING"
    if ($listening) { $portalReady = $true; break }
    Start-Sleep 2
}
if (-not $portalReady) { Fail "prediction-portal never opened port 3001 — check $PortalLog" }

# Phase 2: Wait for HTTP 200 (give Next.js time for Turbopack lazy compilation)
$portalReady = $false
$portalLastError = ""
for ($i = 0; $i -lt 15; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$PortalPort/api/health" -UseBasicParsing -TimeoutSec $HealthCheckTimeoutSec
        if ($resp.StatusCode -eq 200) { $portalReady = $true; break }
    } catch {
        # Fallback: check root page if /api/health doesn't exist yet
        try {
            $resp = Invoke-WebRequest -Uri "http://127.0.0.1:$PortalPort" -UseBasicParsing -TimeoutSec $HealthCheckTimeoutSec
            if ($resp.StatusCode -eq 200) { $portalReady = $true; break }
        } catch {
            $portalLastError = $_.Exception.Message
            Info "  Health check attempt $($i+1)/15 failed: $portalLastError"
        }
    }
    Start-Sleep 2
}
if (-not $portalReady) { Fail "prediction-portal failed to start — last error: $portalLastError — check $PortalLog" }
Pass "prediction-portal ready (PID: $portalPid)"

# ════════════════════════════════════════════
#  Output PIDs for stop-all.ps1
# ════════════════════════════════════════════
$pidFile = Join-Path $ProjectRoot ".e2e-pids.json"
@{ predPid = $predPid; estPid = $estPid; marketPid = $marketPid; portalPid = $portalPid } | ConvertTo-Json | Set-Content $pidFile
Info "PIDs saved to $pidFile"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Services started successfully!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
  Write-Host "  price-prediction-api:  http://127.0.0.1:$PredictionPort"
  Write-Host "  value-estimator-api:   http://127.0.0.1:$EstimatorPort"
  Write-Host "  market-analysis-api:   http://127.0.0.1:$MarketAnalysisPort"
  Write-Host "  prediction-portal:     http://127.0.0.1:$PortalPort"
Write-Host ""
Info "Run '.\ci\e2e-run.ps1' to execute tests"
Info "Run '.\ci\stop-all.ps1' to stop services"

} catch {
    Fail "Startup failed: $($_.Exception.Message)"
    Stop-ServicePid $predPid
    Stop-ServicePid $estPid
    Stop-ServicePid $marketPid
    Stop-ServicePid $portalPid
    exit 1
}
