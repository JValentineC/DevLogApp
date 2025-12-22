# Deploy Backend to NFSN (Source Files Only)
$SERVER = "jvc_devlogs-api@ssh.nyc1.nearlyfreespeech.net"
$REMOTE_DIR = "/home/public"

Write-Host "🚀 Deploying Backend Source Files..." -ForegroundColor Cyan

# Upload only source files (no node_modules)
Write-Host "📤 Uploading index.js..." -ForegroundColor Yellow
scp deploy/index.js "${SERVER}:${REMOTE_DIR}/index.js"

Write-Host "📤 Uploading package.json..." -ForegroundColor Yellow
scp deploy/package.json "${SERVER}:${REMOTE_DIR}/package.json"

Write-Host "📤 Uploading middleware..." -ForegroundColor Yellow
scp -r deploy/middleware "${SERVER}:${REMOTE_DIR}/"

Write-Host ""
Write-Host "✅ Source files uploaded!" -ForegroundColor Green
Write-Host ""
Write-Host "🔧 Now SSH to server and run:" -ForegroundColor Cyan
Write-Host "  ssh $SERVER" -ForegroundColor White
Write-Host "  cd $REMOTE_DIR" -ForegroundColor White
Write-Host "  npm install" -ForegroundColor Yellow
Write-Host "  # Then restart Node.js daemon from NFSN control panel" -ForegroundColor Yellow
