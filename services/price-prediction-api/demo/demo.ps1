# Demo script: build Docker image, start container, test all API endpoints
# Usage: .\demo.ps1

$ErrorActionPreference = "Stop"
$IMAGE_NAME = "housing-price-api"
$CONTAINER_NAME = "housing-price-api-demo"
$PORT = 8000

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Housing Price Prediction API — Demo" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build
Write-Host "[1/4] Building Docker image..."
Set-Location (Split-Path $PSScriptRoot -Parent)
docker build -t $IMAGE_NAME .
Write-Host "  ✓ Image built: $IMAGE_NAME" -ForegroundColor Green
Write-Host ""

# Step 2: Run
Write-Host "[2/4] Starting container..."
docker rm -f $CONTAINER_NAME 2>$null
docker run -d --name $CONTAINER_NAME -p "${PORT}:${PORT}" $IMAGE_NAME
Write-Host "  ✓ Container started: $CONTAINER_NAME on port $PORT" -ForegroundColor Green
Write-Host ""

# Wait
Write-Host "  Waiting for service to be ready..."
for ($i = 1; $i -le 15; $i++) {
    try {
        $null = Invoke-WebRequest -Uri "http://localhost:$PORT/health" -UseBasicParsing
        Write-Host "  ✓ Service is ready!" -ForegroundColor Green
        break
    } catch {
        if ($i -eq 15) {
            Write-Host "  ✗ Service failed to start. Check logs: docker logs $CONTAINER_NAME" -ForegroundColor Red
            exit 1
        }
        Start-Sleep -Seconds 1
    }
}
Write-Host ""

# Step 3: Test
Write-Host "[3/4] Testing API endpoints..." -ForegroundColor Cyan
Write-Host ""

Write-Host "--- GET /health ---" -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:$PORT/health" | ConvertTo-Json
Write-Host ""

Write-Host "--- POST /predict (single) ---" -ForegroundColor Yellow
$singleBodyJson = @{
    features = @(@{
        square_footage = 1550; bedrooms = 3; bathrooms = 2
        year_built = 1997; lot_size = 6800
        distance_to_city_center = 4.1; school_rating = 7.6
    })
} | ConvertTo-Json

Write-Host "  Request body:" -ForegroundColor Gray
$singleBodyJson | ConvertFrom-Json | ConvertTo-Json -Depth 10
Write-Host "  Response:" -ForegroundColor Gray
Invoke-RestMethod -Uri "http://localhost:$PORT/predict" `
    -Method Post `
    -ContentType "application/json" `
    -Body $singleBodyJson | ConvertTo-Json
Write-Host ""

Write-Host "--- POST /predict (batch) ---" -ForegroundColor Yellow
$batchBodyJson = @{
    features = @(
        @{ square_footage = 1550; bedrooms = 3; bathrooms = 2;
           year_built = 1997; lot_size = 6800;
           distance_to_city_center = 4.1; school_rating = 7.6 },
        @{ square_footage = 2200; bedrooms = 4; bathrooms = 2.5;
           year_built = 2008; lot_size = 9600;
           distance_to_city_center = 7.0; school_rating = 8.8 }
    )
} | ConvertTo-Json

Write-Host "  Request body:" -ForegroundColor Gray
$batchBodyJson | ConvertFrom-Json | ConvertTo-Json -Depth 10
Write-Host "  Response:" -ForegroundColor Gray
Invoke-RestMethod -Uri "http://localhost:$PORT/predict" `
    -Method Post `
    -ContentType "application/json" `
    -Body $batchBodyJson | ConvertTo-Json
Write-Host ""

Write-Host "--- GET /model-info ---" -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:$PORT/model-info" | ConvertTo-Json
Write-Host ""

# Step 4: Swagger
Write-Host "[4/4] Swagger UI ready!" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Swagger UI: http://localhost:$PORT/docs" -ForegroundColor Green
Write-Host "  Stop:       docker stop $CONTAINER_NAME" -ForegroundColor Green
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Demo complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Pause so the window doesn't close immediately
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
