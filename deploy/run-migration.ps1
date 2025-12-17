# PowerShell script to execute database migration
# Run this from your local machine

$server = "jvc_devlogs-api@ssh.nyc1.nearlyfreespeech.net"

Write-Host "=== DevLogs Database Migration ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Verify migration script is uploaded
Write-Host "Step 1: Verifying migration script..." -ForegroundColor Yellow
ssh $server "ls -lh /home/tmp/migrate-to-new-schema.sql"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Migration script not found. Uploading now..." -ForegroundColor Red
    scp deploy/migrate-to-new-schema.sql ${server}:/home/tmp/
}

Write-Host ""

# Step 2: Create backup
Write-Host "Step 2: Creating database backup..." -ForegroundColor Yellow
Write-Host "You will be prompted for your SSH password and then database password" -ForegroundColor Gray
$backupDate = Get-Date -Format "yyyyMMdd_HHmmss"
ssh $server "mysqldump -h devlogs.db -u jvc -p devlogs > /home/tmp/backup_$backupDate.sql"

Write-Host "✓ Backup created: backup_$backupDate.sql" -ForegroundColor Green
Write-Host ""

# Step 3: Update emails
Write-Host "Step 3: Updating user emails to @icstars.org format..." -ForegroundColor Yellow
$updateEmailSQL = @"
UPDATE User SET email = CONCAT(username, '@icstars.org') WHERE email NOT LIKE '%@icstars.org';
SELECT id, email, username FROM User;
"@

ssh $server "mysql -h devlogs.db -u jvc -p devlogs -e `"$updateEmailSQL`""

Write-Host ""

# Step 4: Run migration
Write-Host "Step 4: Running migration script..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor Gray
Write-Host "  - Add firstName, middleName, lastName columns" -ForegroundColor Gray
Write-Host "  - Add password and passwordHint columns" -ForegroundColor Gray
Write-Host "  - Create Tag table with 15 default tags" -ForegroundColor Gray
Write-Host "  - Create DevLogTag junction table" -ForegroundColor Gray
Write-Host "  - Add createdBy and images columns to DevLog" -ForegroundColor Gray
Write-Host ""

$confirm = Read-Host "Continue with migration? (yes/no)"

if ($confirm -eq "yes") {
    ssh $server "mysql -h devlogs.db -u jvc -p devlogs < /home/tmp/migrate-to-new-schema.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "✗ Migration failed. Restore from backup if needed." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""

# Step 5: Verify migration
Write-Host "Step 5: Verifying migration..." -ForegroundColor Yellow
$verifySQL = @"
SELECT 'User Table Structure:' as info; DESCRIBE User;
SELECT 'Tag Count:' as info; SELECT COUNT(*) as count FROM Tag;
SELECT 'Sample Tags:' as info; SELECT id, name, color FROM Tag LIMIT 5;
SELECT 'Updated Users:' as info; SELECT id, firstName, lastName, email FROM User;
"@

ssh $server "mysql -h devlogs.db -u jvc -p devlogs -e `"$verifySQL`""

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Update backend API (deploy/index-noprisma.js)" -ForegroundColor White
Write-Host "2. Update frontend forms for new User fields" -ForegroundColor White
Write-Host "3. Test login with updated email format" -ForegroundColor White
Write-Host "4. Users should update their passwords" -ForegroundColor White
Write-Host ""
Write-Host "Backup location: /home/tmp/backup_$backupDate.sql" -ForegroundColor Gray
