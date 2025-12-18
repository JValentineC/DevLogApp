#!/usr/bin/env pwsh
# PowerShell script to deploy RBAC implementation to NearlyFreeSpeech.net

Write-Host "=== RBAC Deployment Script ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SSH_HOST = "ssh.phx.nearlyfreespeech.net"
$SSH_USER = "jvc"
$REMOTE_DIR = "/home/protected"
$DB_HOST = "devlogs.db"
$DB_USER = "jvc"
$DB_NAME = "devlogs"

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Upload database migration script" -ForegroundColor Yellow
Write-Host "2. Run migration to add role column" -ForegroundColor Yellow
Write-Host "3. Set JValentineC as super_admin" -ForegroundColor Yellow
Write-Host "4. Upload updated backend files" -ForegroundColor Yellow
Write-Host "5. Restart the daemon" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Step 1: Uploading migration script..." -ForegroundColor Green

# Upload migration script
scp add-roles.sql "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload migration script!" -ForegroundColor Red
    exit 1
}

Write-Host "Step 2: Running database migration..." -ForegroundColor Green
Write-Host "You will be prompted for the database password" -ForegroundColor Yellow
Write-Host ""

# Run migration
ssh "${SSH_USER}@${SSH_HOST}" "mysql -h $DB_HOST -u $DB_USER -p $DB_NAME < ${REMOTE_DIR}/add-roles.sql"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to run migration!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 3: Uploading updated backend files..." -ForegroundColor Green

# Upload middleware
scp middleware/auth.js "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/middleware/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload middleware!" -ForegroundColor Red
    exit 1
}

# Upload main backend
scp index-noprisma.js "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload backend!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 4: Restarting daemon..." -ForegroundColor Green

ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && daemon --restart"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to restart daemon!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Build frontend: cd .. && npm run build" -ForegroundColor White
Write-Host "2. Deploy to GitHub Pages (if configured)" -ForegroundColor White
Write-Host "3. Test login at: https://jvalentinec.github.io/DevLogApp/" -ForegroundColor White
Write-Host "4. Verify Admin tab appears for JValentineC" -ForegroundColor White
Write-Host "5. Test user management features" -ForegroundColor White
Write-Host ""
Write-Host "Testing backend API:" -ForegroundColor Cyan
Write-Host "curl https://devlogs-api.nfshost.com/api/health" -ForegroundColor White
Write-Host ""
