# Cloudinary Image Storage Setup

## Overview

This application uses Cloudinary for cloud-based image storage, replacing the previous base64 database storage method.

## Benefits

- **99.7% reduction** in database storage
- Automatic image optimization (WebP/AVIF)
- CDN delivery for faster loading
- Automatic resizing (500x500 max)
- No file size limits on database

## Setup Instructions

### 1. Create Cloudinary Account

1. Go to https://cloudinary.com/users/register/free
2. Sign up for a free account (25GB storage, 25GB bandwidth)
3. Verify your email

### 2. Get Your Credentials

From your Cloudinary Dashboard (https://console.cloudinary.com/):

- **Cloud Name**: `your_cloud_name`
- **API Key**: `your_api_key`
- **API Secret**: `your_api_secret`

### 3. Configure Environment Variables

#### Local Development (.env)

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Production (NFSN)

SSH into your server and add to the .env file:

```bash
ssh jvc_devlogs-api@ssh.nyc1.nearlyfreespeech.net
cd /home/protected
nano .env
```

Add the same variables:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Install Dependencies

```bash
cd deploy
npm install cloudinary multer
```

### 5. Upload Configuration

The backend is configured to:

- Accept images up to 10MB
- Resize to max 500x500 pixels
- Convert to optimized formats (WebP/AVIF)
- Store in `devlogs/profiles` folder on Cloudinary

## API Endpoints

### Upload Profile Photo

```http
POST /api/users/:id/profile-photo
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body: FormData with 'photo' file field
```

**Response:**

```json
{
  "success": true,
  "photoUrl": "https://res.cloudinary.com/your_cloud/image/upload/..."
}
```

## Frontend Integration

### Using FormData

```javascript
const formData = new FormData();
formData.append("photo", fileInput.files[0]);

const response = await fetch(`/api/users/${userId}/profile-photo`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});
```

## Migration from Base64

If you have existing base64 images in the database:

```sql
-- Check how many users have base64 images
SELECT COUNT(*) FROM User WHERE profilePhoto LIKE 'data:image%';

-- Clear old base64 images (after backing up)
UPDATE User SET profilePhoto = NULL WHERE profilePhoto LIKE 'data:image%';
```

Users will need to re-upload their profile photos.

## Cloudinary Dashboard

Monitor usage at: https://console.cloudinary.com/

### Folder Structure

```
devlogs/
├── profiles/          # Profile photos
│   ├── user_123_abc123.jpg
│   └── user_456_def456.png
└── devlog_images/     # Future: DevLog entry images
```

## Troubleshooting

### Error: "Invalid API Key"

- Check that CLOUDINARY_API_KEY is correct
- Ensure no spaces or quotes in .env file
- Restart Node.js server after .env changes

### Error: "Upload failed"

- Check file size (max 10MB)
- Verify file is an image (jpg, png, gif, webp)
- Check Cloudinary bandwidth limits

### Images not loading

- Verify Cloudinary URL is publicly accessible
- Check CORS settings in Cloudinary dashboard
- Ensure CDN is not blocked by firewall

## Cost Monitoring

Free tier limits (as of 2024):

- Storage: 25 GB
- Bandwidth: 25 GB/month
- Transformations: 25,000/month

Monitor at: https://console.cloudinary.com/console/usage

## Security Notes

- API Secret should NEVER be exposed to frontend
- All uploads go through backend API
- Images are publicly readable (good for profile photos)
- Consider signed uploads for sensitive images
