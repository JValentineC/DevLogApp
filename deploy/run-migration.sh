#!/bin/bash
# Migration execution script for NearlyFreeSpeech server

echo "=== DevLogs Database Migration Script ==="
echo ""

# Step 1: Create backup
echo "Step 1: Creating backup..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
mysqldump -h devlogs.db -u jvc -p devlogs > "/home/tmp/$BACKUP_FILE"
echo "✓ Backup created: /home/tmp/$BACKUP_FILE"
echo ""

# Step 2: Check current data
echo "Step 2: Checking current data..."
echo "Current Users:"
mysql -h devlogs.db -u jvc -p devlogs -e "SELECT id, email, username, name FROM User;"
echo ""

echo "Checking emails that don't end with @icstars.org:"
mysql -h devlogs.db -u jvc -p devlogs -e "SELECT id, email FROM User WHERE email NOT LIKE '%@icstars.org';"
echo ""

# Step 3: Update non-compliant emails
echo "Step 3: Updating emails to @icstars.org format..."
mysql -h devlogs.db -u jvc -p devlogs -e "UPDATE User SET email = CONCAT(username, '@icstars.org') WHERE email NOT LIKE '%@icstars.org';"
echo "✓ Emails updated"
echo ""

# Step 4: Set default passwords for existing users
echo "Step 4: Setting temporary passwords..."
mysql -h devlogs.db -u jvc -p devlogs -e "UPDATE User SET password = 'TempPass123!' WHERE password IS NULL OR password = '';"
echo "✓ Default passwords set (MUST BE CHANGED AFTER LOGIN)"
echo ""

# Step 5: Run migration
echo "Step 5: Running migration script..."
mysql -h devlogs.db -u jvc -p devlogs < /home/tmp/migrate-to-new-schema.sql
echo "✓ Migration completed"
echo ""

# Step 6: Verify migration
echo "Step 6: Verifying migration..."
echo "User table structure:"
mysql -h devlogs.db -u jvc -p devlogs -e "DESCRIBE User;"
echo ""

echo "Tag table contents:"
mysql -h devlogs.db -u jvc -p devlogs -e "SELECT id, name, color FROM Tag;"
echo ""

echo "DevLog table structure:"
mysql -h devlogs.db -u jvc -p devlogs -e "DESCRIBE DevLog;"
echo ""

echo "=== Migration Complete ==="
echo "Backup location: /home/tmp/$BACKUP_FILE"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. All users must change their passwords from 'TempPass123!'"
echo "2. Verify all emails are correct (@icstars.org)"
echo "3. Update backend API to support new schema"
echo "4. Update frontend forms"
