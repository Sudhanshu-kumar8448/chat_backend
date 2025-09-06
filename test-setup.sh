#!/bin/bash

echo "🚀 Community Chat Backend Setup & Test Script"
echo "=============================================="

# Check if MongoDB is running
echo "📊 Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    echo "✅ MongoDB CLI found"
else
    echo "⚠️  MongoDB CLI not found. Please install MongoDB"
fi

# Check Node.js version
echo "📦 Node.js version:"
node --version

# Check if environment file exists
if [ -f ".env" ]; then
    echo "✅ Environment file found"
else
    echo "⚠️  Environment file not found. Please copy .env.example to .env and configure it"
fi

# Run basic server test
echo "🧪 Running basic server test..."
npm run dev &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
echo "🔍 Testing health endpoint..."
if command -v curl &> /dev/null; then
    curl -s http://localhost:3000/health | grep -q "success" && echo "✅ Server is responding" || echo "❌ Server not responding"
else
    echo "⚠️  curl not found, cannot test endpoints"
fi

# Kill the server
kill $SERVER_PID

echo ""
echo "🎉 Setup complete! Next steps:"
echo "1. Configure your .env file with Firebase credentials"
echo "2. Start MongoDB"
echo "3. Run: npm run dev"
echo "4. Visit: http://localhost:3000/api-docs"
