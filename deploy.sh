#!/bin/bash

# Deploy to GitHub Pages
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Deploying Code Connect Builder to GitHub Pages..."

# Check if gh-pages package is installed
if ! npm list gh-pages > /dev/null 2>&1; then
  echo "❌ gh-pages package not found. Installing..."
  npm install --save-dev gh-pages
fi

# Build the project
echo "📦 Building project..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo "✅ Build complete"

# Deploy to gh-pages
echo "🌐 Deploying to GitHub Pages..."
npm run deploy

echo "✨ Deployment complete!"
echo "🔗 Your site will be available at: https://[your-username].github.io/code-connect-builder/"
echo ""
echo "Note: It may take a few minutes for changes to appear on GitHub Pages."
