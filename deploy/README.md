# Quick Deployment Guide

## What You Have
- Site URL: https://devlogs-api.nfshost.com/
- Database: devlogs.db
- Database User: jvc
- Database Password: AaJ4WT9gmq?_y

## Files Ready in `deploy/` folder
All files needed for deployment are in the `deploy/` folder.

## Step-by-Step Deployment

### 1. Create Database in NFS Control Panel
1. Log into https://members.nearlyfreespeech.net/
2. Go to "Databases" → Click on "devlogs.db"
3. Click "Create Database"
4. Database name: `devlogs`
5. Click "Create"

### 2. Upload Files via SFTP
Use an SFTP client (FileZilla, WinSCP, or Cyberduck):

**Connection Details:**
- Host: `ssh.phx.nearlyfreespeech.net`
- Port: `22`
- Protocol: `SFTP`
- Username: `devlogs-api_nfsn_user` (check your NFS email for exact username)
- Password: (your NFS account password)

**Upload these files from `deploy/` folder to `/home/protected/` on the server:**
- `index.js`
- `package.json`
- `.env`
- `prisma/` (entire folder)

### 3. SSH into Server and Install
```bash
# Connect via SSH
ssh devlogs-api_nfsn_user@ssh.phx.nearlyfreespeech.net

# Navigate to protected directory
cd /home/protected

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migration
npx prisma migrate deploy
```

### 4. Create and Start Daemon
In NFS Control Panel:
1. Go to your site "devlogs-api"
2. Click "Daemons" tab
3. Click "Add a Daemon"
4. Fill in:
   - **Command Path**: `/usr/local/bin/node`
   - **Working Directory**: `/home/protected`
   - **Command-Line Arguments**: `index.js`
   - **Tag**: `api-server`
5. Click "Add Daemon"
6. Click "Start" next to your new daemon

### 5. Test Your API
Visit: https://devlogs-api.nfshost.com/api/health

You should see:
```json
{"status":"OK","message":"DevLogger API is running"}
```

### 6. Update Frontend Configuration
Update your local `.env` file:
```env
VITE_API_URL=https://devlogs-api.nfshost.com/api
```

Then rebuild and deploy frontend:
```bash
npm run deploy
```

## Troubleshooting

**If daemon won't start:**
- Check daemon logs in NFS control panel
- Verify all files uploaded correctly
- Ensure database "devlogs" was created
- Check that `.env` file has correct credentials

**If you get database errors:**
- Verify DATABASE_URL in `.env` is correct
- Make sure you ran `npx prisma migrate deploy`
- Check database exists in NFS control panel

**To view daemon logs:**
- In NFS control panel, go to site → Daemons
- Click on your daemon tag
- View output/error logs
