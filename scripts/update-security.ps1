# ESG-Lite Security Update Script
# Скрипт для безопасного обновления Docker контейнеров

param(
    [switch]$Force,
    [switch]$Test,
    [string]$Service = "all"
)

Write-Host "=== ESG-Lite Security Update Script ===" -ForegroundColor Green
Write-Host "Starting security update for Docker containers..." -ForegroundColor Yellow

# Проверяем, что мы в правильной директории
if (-not (Test-Path "package.json")) {
    Write-Error "Error: package.json not found. Please run this script from the project root."
    exit 1
}

# Останавливаем существующие контейнеры
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
try {
    if ($Service -eq "all") {
        docker-compose -f docker-compose.prod.yml down
    } else {
        docker-compose -f docker-compose.prod.yml stop $Service
    }
} catch {
    Write-Warning "Some containers may not be running: $($_.Exception.Message)"
}

# Очищаем старые образы (если Force)
if ($Force) {
    Write-Host "Removing old images..." -ForegroundColor Yellow
    docker system prune -f
    docker image prune -a -f
}

# Собираем новые образы с безопасными базовыми образами
Write-Host "Building new secure images..." -ForegroundColor Yellow

if ($Service -eq "all" -or $Service -eq "web") {
    Write-Host "Building web application (distroless)..." -ForegroundColor Cyan
    docker build -t esg-lite-web:secure .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build web application"
        exit 1
    }
}

if ($Service -eq "all" -or $Service -eq "worker") {
    Write-Host "Building OCR worker (Alpine with Tesseract)..." -ForegroundColor Cyan
    docker build -f Dockerfile.worker -t esg-lite-worker:secure .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to build OCR worker"
        exit 1
    }
}

# Проверяем образы на уязвимости (если docker scout доступен)
Write-Host "Checking for vulnerabilities..." -ForegroundColor Yellow
try {
    if (Get-Command docker-scout -ErrorAction SilentlyContinue) {
        Write-Host "Scanning web image for vulnerabilities..." -ForegroundColor Cyan
        docker scout cves esg-lite-web:secure
        
        Write-Host "Scanning worker image for vulnerabilities..." -ForegroundColor Cyan
        docker scout cves esg-lite-worker:secure
    } else {
        Write-Warning "Docker Scout not available. Skipping vulnerability scan."
    }
} catch {
    Write-Warning "Vulnerability scan failed: $($_.Exception.Message)"
}

# Тестовый запуск (если Test параметр)
if ($Test) {
    Write-Host "Starting test deployment..." -ForegroundColor Cyan
    docker-compose -f docker-compose.prod.yml up -d
    
    Write-Host "Waiting for services to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Проверяем health checks
    Write-Host "Checking service health..." -ForegroundColor Cyan
    $healthCheck = docker-compose -f docker-compose.prod.yml ps --format json | ConvertFrom-Json
    
    foreach ($service in $healthCheck) {
        if ($service.State -eq "running") {
            Write-Host "✓ $($service.Service) is running" -ForegroundColor Green
        } else {
            Write-Host "✗ $($service.Service) is $($service.State)" -ForegroundColor Red
        }
    }
    
    # Тест API endpoint
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/queue/health" -TimeoutSec 10
        Write-Host "✓ Health API responded: $($response.status)" -ForegroundColor Green
    } catch {
        Write-Host "✗ Health API failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host "Test completed. Check logs if any issues." -ForegroundColor Yellow
    
} else {
    # Производственный запуск
    Write-Host "Starting production deployment..." -ForegroundColor Green
    if ($Service -eq "all") {
        docker-compose -f docker-compose.prod.yml up -d
    } else {
        docker-compose -f docker-compose.prod.yml up -d $Service
    }
}

# Показываем статус
Write-Host "Deployment status:" -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml ps

# Показываем логи последних нескольких минут
Write-Host "Recent logs:" -ForegroundColor Yellow
docker-compose -f docker-compose.prod.yml logs --tail=50

Write-Host "=== Security Update Complete ===" -ForegroundColor Green
Write-Host "Images updated to use secure base images:" -ForegroundColor Cyan
Write-Host "  • Web: distroless nodejs22-debian12:nonroot" -ForegroundColor White
Write-Host "  • Worker: node:22-alpine (latest security patches)" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Monitor logs for any issues" -ForegroundColor White
Write-Host "  2. Test OCR functionality" -ForegroundColor White
Write-Host "  3. Verify health endpoints" -ForegroundColor White
Write-Host "  4. Update CI/CD pipeline if needed" -ForegroundColor White
