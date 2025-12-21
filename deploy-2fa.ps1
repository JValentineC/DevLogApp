# Two-Factor Authentication Deployment Script
# Run this after completing backend integration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  2FA Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build frontend
Write-Host "[1/3] Building frontend..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAILED] Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Frontend built successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy to GitHub Pages
Write-Host "[2/3] Deploying to GitHub Pages..." -ForegroundColor Yellow
npm run deploy
if ($LASTEXITCODE -ne 0) {
    Write-Host "[FAILED] Deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Frontend deployed!" -ForegroundColor Green
Write-Host ""

# Step 3: Remind about backend
Write-Host "[3/3] Backend Deployment Checklist:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Complete these steps manually:" -ForegroundColor Cyan
Write-Host "  1. Integrate 2FA endpoints into index-noprisma.js"
Write-Host "  2. Upload files to server via SCP"
Write-Host "  3. Run database migration: add-2fa-support.sql"
Write-Host "  4. Install npm packages: speakeasy, qrcode"
Write-Host "  5. Restart backend server"
Write-Host ""
Write-Host "See TWO_FACTOR_AUTH_GUIDE.md for detailed steps!" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Test your app: https://jvalentinec.github.io/DevLogApp/" -ForegroundColor Yellow
Write-Host ""
