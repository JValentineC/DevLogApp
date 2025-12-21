#!/usr/bin/env pwsh
# PowerShell script to deploy author information fix to NearlyFreeSpeech.net

Write-Host "=== Author Information Fix Deployment ===" -ForegroundColor Cyan
Write-Host ""

# Configuration
$SSH_HOST = "ssh.phx.nearlyfreespeech.net"
$SSH_USER = "jvc"
$REMOTE_DIR = "/home/protected"

Write-Host "This script will:" -ForegroundColor Yellow
Write-Host "1. Upload updated index-noprisma.js with author information" -ForegroundColor Yellow
Write-Host "2. Restart the daemon" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue? (y/n)"
if ($confirm -ne "y") {
    Write-Host "Deployment cancelled." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Step 1: Uploading updated backend..." -ForegroundColor Green

# Upload main backend
scp index-noprisma.js "${SSH_USER}@${SSH_HOST}:${REMOTE_DIR}/"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to upload backend!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Step 2: Restarting daemon..." -ForegroundColor Green

ssh "${SSH_USER}@${SSH_HOST}" "cd ${REMOTE_DIR} && daemon --restart"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to restart daemon!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Deployment Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "The backend has been updated to include author information." -ForegroundColor Cyan
Write-Host "Posts should now show the author's name instead of 'Unknown Author'." -ForegroundColor Cyan
Write-Host ""
