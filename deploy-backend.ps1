# Deploy Backend to NearlyFreeSpeech.NET
# This script uploads your backend to the NFSN server

$SERVER = "jvc_devlogs-api@ssh.nyc1.nearlyfreespeech.net"
$REMOTE_DIR = "/home/public"

Write-Host "Deploying Backend to NearlyFreeSpeech.NET..." -ForegroundColor Cyan

# Create a temporary deployment package (exclude node_modules)
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$deployFiles = @(
    "deploy/index.js",
    "deploy/package.json",
    "deploy/.env",
    "deploy/config/",
    "deploy/middleware/"
)

# Upload files via SCP
Write-Host "Uploading files to server..." -ForegroundColor Yellow
scp deploy/index.js "${SERVER}:${REMOTE_DIR}/"
scp deploy/package.json "${SERVER}:${REMOTE_DIR}/"
scp -r deploy/middleware "${SERVER}:${REMOTE_DIR}/"
scp -r deploy/migrations "${SERVER}:${REMOTE_DIR}/"

Write-Host ""
Write-Host "Files uploaded!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps - Run these commands on the server:" -ForegroundColor Cyan
Write-Host "ssh $SERVER" -ForegroundColor White
Write-Host "cd $REMOTE_DIR" -ForegroundColor White
Write-Host "npm install" -ForegroundColor White
Write-Host "node index.js" -ForegroundColor White
