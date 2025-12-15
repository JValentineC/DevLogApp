# Deployment Instructions for NearlyFreeSpeech.net

## Prerequisites

1. Database created: ✓ devlogs.db
2. Site created on NearlyFreeSpeech (you'll need to create this)

## Files to Upload

Upload these files/folders from the `server` directory to your NFS site:

- `index.js` - Main server file
- `package.json` - Dependencies
- `.env.production` - Rename to `.env` after uploading
- `../prisma/` folder - Database schema

## Deployment Steps

### 1. Create a Site on NearlyFreeSpeech

- Go to https://members.nearlyfreespeech.net/
- Click "Sites" → "Create a New Site"
- Choose a short name (e.g., "devlogs-api")
- Your site URL will be: `https://devlogs-api.nfshost.com`

### 2. Create Database in NFS Control Panel

- Go to your database process (devlogs.db)
- Click "Create Database"
- Database name: `devlogs`
- This creates the actual database that your app will use

### 3. Upload Files via SSH/SFTP

```bash
# Connect via SSH (replace YOUR_SITE with your site name)
ssh YOUR_SITE_nfsn_user@ssh.phx.nearlyfreespeech.net

# Or use SFTP client like FileZilla:
# Host: ssh.phx.nearlyfreespeech.net
# Username: YOUR_SITE_nfsn_user
# Password: (your NFS password)
# Port: 22
```

### 4. Install Dependencies on Server

```bash
cd /home/protected
npm install
```

### 5. Run Database Migration

```bash
npx prisma migrate deploy
```

### 6. Configure Node.js Daemon

In NFS control panel:

- Go to your Site → "Daemons"
- Click "Add Daemon"
- Command Path: `/usr/local/bin/node`
- Working Directory: `/home/protected`
- Command Line Arguments: `index.js`
- Tag: `api-server`
- Click "Start Daemon"

### 7. Configure Site Settings

In Site Config:

- Enable "Node.js" if not already enabled
- Set Node.js version to latest (20.x or higher)

## After Deployment

Your API will be available at: `https://YOUR_SITE.nfshost.com/api`

Update your frontend `.env`:

```env
VITE_API_URL=https://YOUR_SITE.nfshost.com/api
```

Then rebuild and redeploy your frontend:

```bash
npm run deploy
```

## Troubleshooting

- Check daemon logs in NFS control panel under "Daemons"
- Verify DATABASE_URL is correct in `.env`
- Ensure database "devlogs" exists
- Check that all dependencies installed correctly
