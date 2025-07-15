#!/bin/bash

# Deploy script for SlowSurf web hosting
# This script deploys the SlowSurf website to slowsurf.solvy.dev or locally

set -e

# Check if local flag is provided
LOCAL_MODE=false
if [ "$1" = "local" ] || [ "$1" = "--local" ]; then
    LOCAL_MODE=true
    echo "🚀 Running SlowSurf locally..."
else
    echo "🚀 Deploying SlowSurf to slowsurf.solvy.dev..."
fi

# Function to detect and use the correct docker compose command
docker_compose() {
    if [ "$LOCAL_MODE" = true ]; then
        # Use local docker-compose file
        if command -v docker-compose &> /dev/null; then
            docker-compose -f docker-compose.local.yml "$@"
        elif docker compose version &> /dev/null; then
            docker compose -f docker-compose.local.yml "$@"
        else
            echo "❌ Error: Neither 'docker-compose' nor 'docker compose' found"
            exit 1
        fi
    else
        # Use production docker-compose file
        if command -v docker-compose &> /dev/null; then
            docker-compose "$@"
        elif docker compose version &> /dev/null; then
            docker compose "$@"
        else
            echo "❌ Error: Neither 'docker-compose' nor 'docker compose' found"
            exit 1
        fi
    fi
}

# Check if we're in the right directory
COMPOSE_FILE="docker-compose.yml"
if [ "$LOCAL_MODE" = true ]; then
    COMPOSE_FILE="docker-compose.local.yml"
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Error: $COMPOSE_FILE not found. Are you in the right directory?"
    exit 1
fi

# Check if required files exist
REQUIRED_FILES=("PRIVACY_POLICY.html" "index.html" "404.html" "nginx.conf" "Dockerfile" "favicon.ico")
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
    
    # Get container IP for internal testing
    if [ "$LOCAL_MODE" = true ]; then
        CONTAINER_NAME="slowsurf-web-local"
        TEST_URL="http://localhost:8080"
    else
        CONTAINER_NAME="slowsurf-web"
        CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' $CONTAINER_NAME)
        TEST_URL="http://$CONTAINER_IP:80"
    fi
    
    # Test the health endpoint
    echo "🔍 Testing health endpoint..."
    if curl -f $TEST_URL/health > /dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "⚠️  Health check failed, but container is running"
    fi
    
    # Test the privacy policy endpoint
    echo "🔍 Testing privacy policy endpoint..."
    if curl -f $TEST_URL/privacy > /dev/null 2>&1; then
        echo "✅ Privacy policy endpoint is accessible!"
    else
        echo "❌ Privacy policy endpoint is not accessible"
        exit 1
    fi
    
    # Test root homepage
    echo "🔍 Testing root homepage..."
    if curl -f $TEST_URL/ > /dev/null 2>&1; then
        echo "✅ Root homepage is accessible!"
    else
        echo "⚠️  Root homepage may not be working as expected"
    fi
    
    echo "🎉 Deployment completed successfully!"
    if [ "$LOCAL_MODE" = true ]; then
        echo "📱 Website: http://localhost:8080"
        echo "🔒 Privacy Policy: http://localhost:8080/privacy"
    else
        echo "📱 Website: https://slowsurf.solvy.dev"
        echo "🔒 Privacy Policy: https://slowsurf.solvy.dev/privacy"
    fi
else
    echo "❌ Container failed to start"
    docker_compose logs
    exit 1
fi