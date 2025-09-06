# Render Build Script
#!/bin/bash

echo "🔧 Starting Render deployment build..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --omit=dev

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Set proper permissions
echo "🔒 Setting permissions..."
chmod 755 uploads

echo "✅ Build completed successfully!"
echo "🚀 Ready to start server..."
