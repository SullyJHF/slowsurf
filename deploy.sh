#!/bin/bash

# Deploy script for SlowSurf web hosting
# This script deploys the SlowSurf privacy policy to slowsurf.solvy.dev

set -e

echo "🚀 Deploying SlowSurf to slowsurf.solvy.dev..."

# Function to detect and use the correct docker compose command
docker_compose() {
    if command -v docker-compose &> /dev/null; then
        # Use older docker-compose (hyphenated)
        docker-compose "$@"
    elif docker compose version &> /dev/null; then
        # Use newer docker compose (space-separated)
        docker compose "$@"
    else
        echo "❌ Error: Neither 'docker-compose' nor 'docker compose' found"
        exit 1
    fi
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Are you in the right directory?"
    exit 1
fi

# Check if required files exist
REQUIRED_FILES=("PRIVACY_POLICY.html" "index.html" "404.html" "nginx.conf" "Dockerfile")
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Error: Required file $file not found"
        exit 1
    fi
done

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker_compose down || true

# Remove old images
echo "🧹 Cleaning up old images..."
docker image prune -f || true

# Build and start new containers
echo "🔨 Building and starting containers..."
docker_compose up -d --build

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

# Check if container is running
if docker_compose ps | grep -q "Up"; then
    echo "✅ Container is running successfully!"
    
    # Test the health endpoint
    echo "🔍 Testing health endpoint..."
    if curl -f http://localhost:8080/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed, but container is running"
    fi
    
    # Test the privacy policy endpoint
    echo "🔍 Testing privacy policy endpoint..."
    if curl -f http://localhost:8080/privacy > /dev/null 2>&1; then
        echo "✅ Privacy policy endpoint is accessible!"
    else
        echo "❌ Privacy policy endpoint is not accessible"
        exit 1
    fi
    
    # Test root redirect
    echo "🔍 Testing root redirect..."
    if curl -I http://localhost:8080/ 2>/dev/null | grep -q "301"; then
        echo "✅ Root redirect is working!"
    else
        echo "⚠️  Root redirect may not be working as expected"
    fi
    
    echo "🎉 Deployment completed successfully!"
    echo "📱 Website: https://slowsurf.solvy.dev"
    echo "🔒 Privacy Policy: https://slowsurf.solvy.dev/privacy"
else
    echo "❌ Container failed to start"
    docker_compose logs
    exit 1
fi