#!/bin/bash
# Complete migration script - run this on the NearlyFreeSpeech server
# Usage: bash /home/tmp/run-migration.sh

echo "======================================"
echo "DevLogs Database Migration"
echo "======================================"
echo ""

# Get database password
read -sp "Enter MySQL password: " DBPASS
echo ""

# Step 1: Backup
echo "Step 1: Creating backup..."
mysqldump -h devlogs.db -u jvc -p$DBPASS devlogs > /home/tmp/backup_$(date +%Y%m%d_%H%M%S).sql
echo "✓ Backup created"
echo ""

# Step 2: Update email
echo "Step 2: Updating user email..."
mysql -h devlogs.db -u jvc -p$DBPASS devlogs <<EOF
UPDATE User SET email = 'JValentineC@icstars.org' WHERE id = 1;
SELECT id, email, username, name FROM User;
EOF
echo "✓ Email updated"
echo ""

# Step 3: Run migration
echo "Step 3: Running migration..."
mysql -h devlogs.db -u jvc -p$DBPASS devlogs < /home/tmp/migrate-to-new-schema.sql
echo "✓ Migration complete"
echo ""

# Step 4: Verify
echo "Step 4: Verifying..."
mysql -h devlogs.db -u jvc -p$DBPASS devlogs <<EOF
SELECT '=== User Table Structure ===' as info;
DESCRIBE User;
SELECT '=== Updated User Data ===' as info;
SELECT id, firstName, lastName, email FROM User;
SELECT '=== Tag Count ===' as info;
SELECT COUNT(*) as total_tags FROM Tag;
SELECT '=== Sample Tags ===' as info;
SELECT id, name, color FROM Tag LIMIT 5;
EOF

echo ""
echo "======================================"
echo "Migration Complete!"
echo "======================================"
