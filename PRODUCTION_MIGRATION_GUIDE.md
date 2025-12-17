# 🚀 Production Migration Guide - NearlyFreeSpeech.net

## Step-by-Step Guide to Migrate Production Passwords

### Prerequisites

- ✅ SSH access to your NFS server
- ✅ Database credentials from your .env file
- ✅ The migration script (`migrate-passwords.js`)
- ✅ Updated backend code (`index-noprisma.js`)

---

## 📋 Migration Steps

### Step 1: Backup Your Database (CRITICAL!)

**Option A: Using NFS Web Interface**

1. Log into NearlyFreeSpeech.net
2. Go to your site → Databases
3. Click on your `devlogs` database
4. Click "Manage" → "Export Database"
5. Download the SQL dump file
6. Save it somewhere safe with a timestamp: `devlogs_backup_2025-12-15.sql`

**Option B: Using SSH (if you have command line access)**

```bash
# SSH into your NFS server
ssh username@ssh.nfshost.com

# Create backup
mysqldump -h devlogs.db -u jvc -p devlogs > devlogs_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup was created
ls -lh devlogs_backup_*.sql
```

---

### Step 2: Upload Files to NFS Server

You need to upload these files to your NFS server:

**Files to Upload:**

1. `deploy/index-noprisma.js` (updated backend)
2. `deploy/migrate-passwords.js` (migration script)
3. `deploy/middleware/auth.js` (new authentication middleware)
4. `deploy/package.json` (if you have a separate one for deployment)

**Upload Methods:**

**Option A: Using SFTP Client (FileZilla, WinSCP, etc.)**

```
Host: ssh.nfshost.com (or your NFS SSH hostname)
Username: your-nfs-username
Password: your-nfs-password
Port: 22

Upload to: /home/public/ (or your app directory)
```

**Option B: Using SCP from PowerShell**

```powershell
# Navigate to your deploy folder
cd C:\Users\JonathanRamirez\Documents\Applications\DevLogReactApp\DevLogs\deploy

# Upload files (replace 'username' and 'yoursite' with your NFS details)
scp index-noprisma.js username@ssh.nfshost.com:/home/public/
scp migrate-passwords.js username@ssh.nfshost.com:/home/public/
scp -r middleware username@ssh.nfshost.com:/home/public/
```

**Option C: Using Git (if your NFS site uses Git deployment)**

```bash
# Commit your changes
git add .
git commit -m "Add secure authentication with bcrypt and JWT"
git push origin main

# Then pull on your NFS server
ssh username@ssh.nfshost.com
cd /home/public
git pull origin main
```

---

### Step 3: Update .env on Production Server

**SSH into your server:**

```bash
ssh username@ssh.nfshost.com
```

**Create/Update .env file:**

```bash
cd /home/public  # or your app directory

# Edit .env file
nano .env
# or
vi .env
```

**Add these lines to your production .env:**

```env
# Database (already should exist)
DB_HOST=devlogs.db
DB_USER=jvc
DB_PASSWORD=AaJ4WT9gmq?_y
DB_NAME=devlogs

# Application Settings
NODE_ENV=production
PORT=3001

# JWT Configuration (IMPORTANT!)
JWT_SECRET=1aozEjvG/wv5DzvSJON66Cg9u+/j+XjxZT731MTXddnS48ZUpgwyqa/QiI7xM1CiSJRUA4rraSMHRQYL2+MPng==
JWT_EXPIRES_IN=7d
```

**Save and exit:**

- In nano: Press `Ctrl+X`, then `Y`, then `Enter`
- In vi: Press `Esc`, type `:wq`, press `Enter`

---

### Step 4: Install New Dependencies on Server

**While still in SSH:**

```bash
cd /home/public  # your app directory

# Install new security packages
npm install bcryptjs jsonwebtoken helmet express-rate-limit

# Verify installation
npm list bcryptjs jsonwebtoken helmet express-rate-limit
```

---

### Step 5: Run Password Migration Script

**⚠️ CRITICAL: Make sure you have a backup before this step!**

**While in SSH:**

```bash
cd /home/public  # your app directory

# Run the migration
node migrate-passwords.js
```

**Expected Output:**

```
🔐 Password Migration Script Starting...

✅ Connected to database
📦 Creating backup of User table...
✅ Backup created successfully
👥 Fetching all users...
✅ Found X users to migrate

🔄 Starting password migration...

  ✅ Migrated user: username1 (ID: 1)
  ✅ Migrated user: username2 (ID: 2)
  ...

🔍 Verifying migration...
  ✅ All sampled passwords are properly hashed

============================================================
📊 MIGRATION SUMMARY
============================================================
✅ Successfully migrated: X users
❌ Failed: 0 users
📦 Backup table created
============================================================

✨ Password migration completed!
```

**If you see errors:**

- Check database credentials in .env
- Verify database connection
- Check that User table exists
- Review error messages carefully

---

### Step 6: Restart Your Application

**Option A: If using process manager (PM2, Forever, etc.)**

```bash
# PM2
pm2 restart devlogs-api
# or
pm2 restart all

# Forever
forever restart index-noprisma.js
```

**Option B: If using NFS daemon process**

```bash
# Kill existing process
killall node

# Start new process
nohup node index-noprisma.js > app.log 2>&1 &
```

**Option C: Check NFS documentation for your specific setup**

---

### Step 7: Test the Migration

**Test 1: Health Check**

```bash
curl https://devlogs-api.nfshost.com/api/health
```

Expected: `{"status":"OK","message":"DevLogger API is running"}`

**Test 2: Login with Existing User**

```bash
curl -X POST https://devlogs-api.nfshost.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "your-existing-username",
    "password": "your-existing-password"
  }'
```

Expected: JSON response with `success: true`, user object, and JWT token

**Test 3: Use Protected Endpoint**

```bash
# Use token from previous response
curl -X POST https://devlogs-api.nfshost.com/api/devlogs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "Test Entry",
    "content": "Testing secure authentication",
    "isPublished": true
  }'
```

Expected: JSON response with created dev log entry

---

### Step 8: Test from Frontend

1. Open your frontend application
2. Try logging in with existing credentials
3. Create a new dev log entry
4. Update your profile
5. Verify everything works as before

---

## 🆘 Troubleshooting

### Problem: Migration script can't connect to database

**Solution:**

```bash
# Verify database is running
mysql -h devlogs.db -u jvc -p

# Check .env file has correct credentials
cat .env | grep DB_
```

### Problem: "Passwords appear to already be hashed!"

**Solution:**
Migration already ran successfully. Your passwords are already hashed. Skip to Step 6 (restart app).

### Problem: Login fails after migration

**Solutions:**

1. Check that JWT_SECRET is set in production .env
2. Verify backend server restarted with new code
3. Check browser console for error messages
4. Clear localStorage: `localStorage.clear()`
5. Check server logs for errors

### Problem: "Invalid token" errors

**Solutions:**

```bash
# Verify JWT_SECRET in .env matches what was used to sign tokens
cat .env | grep JWT_SECRET

# Restart server to pick up new environment variables
pm2 restart all
```

---

## 🔄 Rollback Plan (If Something Goes Wrong)

### Restore Database from Backup

**Option A: Using Backup Table (created by script)**

```bash
# SSH into server
ssh username@ssh.nfshost.com

# Connect to MySQL
mysql -h devlogs.db -u jvc -p devlogs

# Find backup table
SHOW TABLES LIKE 'User_Backup_%';

# Restore (replace timestamp with your actual backup table name)
DROP TABLE User;
RENAME TABLE User_Backup_1734307200000 TO User;
EXIT;
```

**Option B: Using SQL Dump File**

```bash
# SSH into server
ssh username@ssh.nfshost.com

# Restore from SQL dump
mysql -h devlogs.db -u jvc -p devlogs < devlogs_backup_2025-12-15.sql
```

### Revert Code Changes

```bash
# If using Git
git checkout HEAD~1 index-noprisma.js
pm2 restart all

# If not using Git, re-upload old version of files
```

---

## ✅ Post-Migration Checklist

- [ ] Database backup created and verified
- [ ] All files uploaded to server
- [ ] Dependencies installed on server
- [ ] .env file updated with JWT_SECRET
- [ ] Password migration completed successfully
- [ ] Application restarted
- [ ] Login tested with existing user
- [ ] Protected endpoints tested
- [ ] Frontend login tested
- [ ] All functionality verified working
- [ ] Backup tables can be deleted (after 1 week of successful operation)

---

## 🗑️ Cleanup (After Verifying Everything Works)

**Wait at least 1 week**, then delete backup tables:

```bash
# SSH into server
ssh username@ssh.nfshost.com

# Connect to MySQL
mysql -h devlogs.db -u jvc -p devlogs

# List backup tables
SHOW TABLES LIKE 'User_Backup_%';

# Delete backup table (only after confirming everything works!)
DROP TABLE User_Backup_1734307200000;
EXIT;
```

---

## 📞 Need Help?

**Check logs:**

```bash
# View application logs
tail -f app.log

# View Node.js process
ps aux | grep node

# Check if server is listening
netstat -tulpn | grep 3001
```

**Common NFS Commands:**

```bash
# View running processes
ps aux | grep node

# Check disk space
df -h

# Check memory usage
free -h
```

---

## 🎯 Summary

1. **Backup database** ✅
2. **Upload files** to NFS server ✅
3. **Update .env** with JWT_SECRET ✅
4. **Install dependencies** ✅
5. **Run migration** script ✅
6. **Restart application** ✅
7. **Test thoroughly** ✅
8. **Celebrate** 🎉

Your DevLog application will now have enterprise-grade security!
