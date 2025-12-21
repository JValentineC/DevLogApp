#!/bin/bash
# Deploy Backend to NearlyFreeSpeech.NET

SERVER="jvc_devlogs-api@ssh.nyc1.nearlyfreespeech.net"
REMOTE_DIR="/home/public"

echo "🚀 Deploying Backend to NearlyFreeSpeech.NET..."
echo ""

# Upload files via SCP
echo "📤 Uploading files to server..."
scp -r deploy/* "${SERVER}:${REMOTE_DIR}/"

echo ""
echo "✅ Files uploaded!"
echo ""
echo "🔧 Now connecting to server to install dependencies..."
ssh "$SERVER" << 'ENDSSH'
cd /home/public
echo "📦 Installing dependencies..."
npm install
echo ""
echo "✅ Backend deployed successfully!"
echo ""
echo "To start the server, run:"
echo "  node index-noprisma.js"
echo ""
echo "Or to run in background:"
echo "  nohup node index-noprisma.js > server.log 2>&1 &"
ENDSSH

echo ""
echo "🎉 Deployment complete!"
