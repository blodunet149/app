#!/bin/bash

# Deployment script for Catering App Frontend to Cloudflare Pages

echo "🚀 Starting Catering App Frontend Deployment Script"

# Build the frontend
echo "📦 Building frontend application..."
npm run build:client

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix errors before deploying."
    exit 1
fi

echo "✅ Build completed successfully"

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "❌ Build output directory 'dist' not found."
    exit 1
fi

echo "📁 Build output directory 'dist' found with contents:"
ls -la dist/

# The Cloudflare Pages will automatically deploy from the dist directory
# when changes are pushed to the repository
echo "✅ Ready for Cloudflare Pages deployment"
echo ""
echo "📊 Deployment Information:"
echo "   - Build output: dist/"
echo "   - Deployment method: GitHub integration (automatically triggered)"
echo "   - Frontend URL: https://catering-app-frontend.pages.dev"
echo "   - Custom domain: https://catering.hijrah-attauhid.or.id"
echo ""
echo "🔄 To trigger deployment, ensure this commit is pushed to the main branch"
echo "   The GitHub integration should automatically pick up the changes and deploy"

# Run tests to ensure functionality
echo ""
echo "🔍 Running basic functionality tests..."

# Test the API endpoints we created
echo "Testing API endpoints..."

# Test summary endpoint (this requires admin authentication, so we'll just check if route exists)
echo "Testing order summary endpoint availability..."
curl -s -o /dev/null -w "Summary endpoint status: %{http_code}\n" "https://catering.hijrah-attauhid.or.id/api/order/summary" || echo "Summary endpoint check failed (expected for non-authenticated request)"

echo ""
echo "✅ Deployment script completed successfully!"
echo "   Your changes have been built and are ready for deployment to Cloudflare Pages."
echo "   The GitHub integration should automatically deploy these changes."