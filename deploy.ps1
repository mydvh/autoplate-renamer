# AutoPlate Renamer - Quick Start Script
# Chạy script này để deploy nhanh với Docker

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  AutoPlate Renamer - Docker Deploy  " -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found! Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "  Download: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
Write-Host "Checking if Docker is running..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running! Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Check .env file
Write-Host ""
Write-Host "Checking .env file..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "✗ .env file not found!" -ForegroundColor Red
    Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please edit .env file and add your GEMINI_API_KEY" -ForegroundColor Yellow
    Write-Host "   Then run this script again." -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "✓ .env file found" -ForegroundColor Green
}

# Check GEMINI_API_KEY
$envContent = Get-Content .env -Raw
if ($envContent -match "GEMINI_API_KEY=\s*$" -or $envContent -notmatch "GEMINI_API_KEY=") {
    Write-Host ""
    Write-Host "⚠️  WARNING: GEMINI_API_KEY is not set in .env file!" -ForegroundColor Yellow
    Write-Host "   The app will not work without it." -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Deployment cancelled." -ForegroundColor Red
        exit 0
    }
}

# Stop existing containers
Write-Host ""
Write-Host "Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "✓ Containers stopped" -ForegroundColor Green

# Build and start
Write-Host ""
Write-Host "Building and starting containers..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Cyan
docker-compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "  Deployment Successful! ✓" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your application at:" -ForegroundColor Cyan
    Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:   http://localhost:5000/api" -ForegroundColor White
    Write-Host "  Health:    http://localhost:5000/api/health" -ForegroundColor White
    Write-Host ""
    Write-Host "Default Login:" -ForegroundColor Cyan
    Write-Host "  Email:     admin@example.com" -ForegroundColor White
    Write-Host "  Password:  123456" -ForegroundColor White
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Cyan
    Write-Host "  View logs:       docker-compose logs -f" -ForegroundColor White
    Write-Host "  Stop services:   docker-compose down" -ForegroundColor White
    Write-Host "  Restart:         docker-compose restart" -ForegroundColor White
    Write-Host ""
    
    # Show logs
    $showLogs = Read-Host "Show live logs? (Y/n)"
    if ($showLogs -ne "n" -and $showLogs -ne "N") {
        Write-Host ""
        Write-Host "Showing logs (Press Ctrl+C to exit)..." -ForegroundColor Yellow
        docker-compose logs -f
    }
} else {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host "  Deployment Failed! ✗" -ForegroundColor Red
    Write-Host "=====================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host "You can view logs with: docker-compose logs" -ForegroundColor Yellow
}
