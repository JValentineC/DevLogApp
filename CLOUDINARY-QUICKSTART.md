# Cloudinary Setup - Quick Start Guide

## ✅ What's Done

- [x] Backend endpoint created: `POST /api/users/:id/profile-photo`
- [x] Cloudinary & Multer packages installed
- [x] Configuration added to deploy/index.js
- [x] Files deployed to NFSN server

## 🔧 What You Need To Do

### 1. Add Cloudinary Credentials to NFSN Server

```bash
ssh jvc_devlogs-api@ssh.nyc1.nearlyfreespeech.net
cd /home/protected
nano .env
```

Add these lines (replace with your actual values from Cloudinary dashboard):

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

Save and exit (Ctrl+X, Y, Enter)

### 2. Install Dependencies on Server

```bash
npm install cloudinary multer
```

### 3. Restart Node.js Process

```bash
pkill node
nohup node index.js > output.log 2>&1 &
```

### 4. Update Local .env File

Edit `c:\Users\JonathanRamirez\Documents\Applications\DevLogReactApp\DevLogs\.env`

Replace placeholders with your actual Cloudinary credentials:

```env
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

## 🧪 Testing

### Test the endpoint with curl:

```bash
curl -X POST \
  https://devlogs-api.nfshost.com/api/users/YOUR_USER_ID/profile-photo \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "photo=@/path/to/your/image.jpg"
```

Expected response:

```json
{
  "success": true,
  "photoUrl": "https://res.cloudinary.com/your_cloud/image/upload/v1234567890/devlogs/profiles/user_123_1234567890.jpg",
  "message": "Profile photo uploaded successfully"
}
```

## 📝 Next Steps

1. **Get your Cloudinary credentials:**

   - Go to https://console.cloudinary.com/
   - Sign up or log in
   - Copy your Cloud Name, API Key, and API Secret

2. **Update both .env files** (local and server) with real credentials

3. **Install dependencies on server** (npm install)

4. **Restart the backend** on NFSN

5. **Integrate frontend:**
   - See `cloudinary-frontend-example.js` for code
   - Update Profile component to use the new endpoint
   - Replace the base64 logic with FormData upload

## 🔍 Verification Checklist

- [ ] Cloudinary account created
- [ ] Credentials added to local .env
- [ ] Credentials added to NFSN .env
- [ ] Dependencies installed on server (cloudinary, multer)
- [ ] Backend restarted on NFSN
- [ ] Test upload successful
- [ ] Images appear in Cloudinary console
- [ ] Images load correctly in browser

## 📚 Documentation

- Full setup guide: CLOUDINARY_SETUP.md
- Frontend example: cloudinary-frontend-example.js
- Cloudinary docs: https://cloudinary.com/documentation

## 🆘 Troubleshooting

If uploads fail, check:

1. Are credentials correct? (no spaces, no quotes)
2. Did you restart Node.js after adding .env vars?
3. Are dependencies installed? Run `npm list cloudinary multer`
4. Check server logs: `cat output.log`
