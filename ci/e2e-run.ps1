# e2e-run.ps1 鈥?Run Playwright E2E tests
# Usage: .\ci\e2e-run.ps1 [--headed] [--demo]
#
# Parameters:
#   --headed    Run Playwright in headed mode (visible browser)
#   --demo      Demo mode: headed + slow-mo 500ms (simulates human click speed)
#
# Prerequisites:
#   - Services running (run e2e-start.ps1 first)
#   - Node.js 18+ with pnpm
#   - Chrome (for Playwright)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$FrontendDir = Join-Path $ProjectRoot "services/nextjs-portal"

# Parse --headed / --demo from $args
$Headed = $false
$Demo = $false
foreach ($arg in $args) {
    switch ($arg) {
        "--headed" { $Headed = $true }
        "--demo"   { $Demo = $true }
        default    { Write-Host "[WARN] Unknown argument: $arg" -ForegroundColor Yellow }
    }
}

function Pass  { Write-Host "[PASS] $args" -ForegroundColor Green }
function Fail  { Write-Host "[FAIL] $args" -ForegroundColor Red; exit 1 }
function Info  { Write-Host "[INFO] $args" -ForegroundColor Yellow }

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  E2E Tests 鈥?Playwright" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲
#  Check services are running
# 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲
Info "Checking services..."
$mlOk = $false; $bkOk = $false; $feOk = $false
try {
    $r1 = Invoke-WebRequest -Uri "http://127.0.0.1:8000/health" -UseBasicParsing -TimeoutSec 3
    if ($r1.Content -match 'healthy') { $mlOk = $true }
} catch {}
try {
    $r2 = Invoke-WebRequest -Uri "http://127.0.0.1:8002/api/v1/health" -UseBasicParsing -TimeoutSec 3
    if ($r2.Content -match 'healthy') { $bkOk = $true }
} catch {}
try {
    $r3 = Invoke-WebRequest -Uri "http://127.0.0.1:3001" -UseBasicParsing -TimeoutSec 3
    if ($r3.StatusCode -eq 200) { $feOk = $true }
} catch {}

if (-not $mlOk) { Fail "ML API not running on port 8000. Run '.\ci\e2e-start.ps1' first." }
if (-not $bkOk) { Fail "Backend not running on port 8002. Run '.\ci\e2e-start.ps1' first." }
if (-not $feOk) { Fail "Frontend not running on port 3001. Run '.\ci\e2e-start.ps1' first." }
Pass "Services are running"

# 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲
#  Run Playwright
# 鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲鈺愨晲
Info "Running Playwright E2E tests..."
Push-Location $FrontendDir
try {
    pnpm install --frozen-lockfile 2>$null

    if ($Demo) {
        Info "Running in DEMO mode (auto-headed + slow-mo 1000ms)"
        $env:PLAYWRIGHT_SLOW_MO = "1000"
        npx playwright test e2e/market-analysis-e2e.spec.ts --reporter=list
        Remove-Item Env:PLAYWRIGHT_SLOW_MO
    } elseif ($Headed) {
        Info "Running in HEADED mode (browser visible)"
        npx playwright test e2e/market-analysis-e2e.spec.ts --reporter=list --headed
    } else {
        Info "Running in HEADLESS mode"
        npx playwright test e2e/market-analysis-e2e.spec.ts --reporter=list
    }
    if ($LASTEXITCODE -ne 0) { Fail "E2E tests failed" }
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  All E2E tests passed!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Info "Coverage: Dashboard / Filter / DataTable / What-If / Export / Nav"
Info "Model: LinearRegression"