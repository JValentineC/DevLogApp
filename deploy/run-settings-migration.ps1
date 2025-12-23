# PowerShell script to run privacy and notification settings migration on NFSN
# Created: December 22, 2025

Write-Host "=== DevLog Privacy & Notification Settings Migration ===" -ForegroundColor Cyan
Write-Host ""

# Read migration SQL
$migrationPath = Join-Path $PSScriptRoot "migrations\add-privacy-notification-settings.sql"

if (-not (Test-Path $migrationPath)) {
    Write-Host "ERROR: Migration file not found at $migrationPath" -ForegroundColor Red
    exit 1
}

Write-Host "Reading migration file..." -ForegroundColor Yellow
$migrationSQL = Get-Content $migrationPath -Raw

Write-Host "Migration SQL loaded successfully" -ForegroundColor Green
Write-Host ""
Write-Host "--- Migration Preview ---" -ForegroundColor Cyan
Write-Host $migrationSQL.Substring(0, [Math]::Min(500, $migrationSQL.Length)) -ForegroundColor Gray
Write-Host "..." -ForegroundColor Gray
Write-Host ""

# Prompt for confirmation
$confirm = Read-Host "Run this migration on NFSN database? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Connecting to NFSN server..." -ForegroundColor Yellow

# SSH command to run migration
$sshCommand = @"
cd /home/protected && \
mysql -h devlogs.db -u jvc -p devlogs
"@

Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. Copy the migration SQL from: $migrationPath" -ForegroundColor White
Write-Host "2. SSH into NFSN: ssh jvc@ssh.phx.nearlyfreespeech.net" -ForegroundColor White
Write-Host "3. Connect to MySQL: mysql -h devlogs.db -u jvc -p devlogs" -ForegroundColor White
Write-Host "4. Paste the migration SQL and execute" -ForegroundColor White
Write-Host "5. Verify with: DESCRIBE User;" -ForegroundColor White
Write-Host ""
Write-Host "Opening migration file for copying..." -ForegroundColor Yellow

# Open the migration file in the default editor
Start-Process $migrationPath

Write-Host ""
Write-Host "Migration file opened. Follow the instructions above to complete the migration." -ForegroundColor Green
Write-Host ""
Write-Host "After running the migration, you can deploy the updated backend:" -ForegroundColor Cyan
Write-Host "  .\deploy-backend.ps1" -ForegroundColor White
Write-Host ""
