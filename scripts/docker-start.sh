#!/bin/bash

# Docker Start Script for Enterprise AI Dev Platform
# This script starts the full stack with BFF architecture

set -e

echo "🚀 Starting Enterprise AI Development Platform..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found"
    echo "   Creating a template .env file..."
    cat > .env << EOF
# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key
EOF
    echo "   Please update .env with your actual credentials"
    echo ""
fi

# Check Docker and Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Use docker compose (newer) or docker-compose (older)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "📦 Building and starting services..."
echo ""

# Start services
$COMPOSE_CMD -f docker-compose.production.yml up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service health
echo ""
echo "🔍 Checking service health..."

# Check API
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ API service is running (http://localhost:8000)"
else
    echo "⚠️  API service may still be starting..."
fi

# Check Dashboard
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Dashboard service is running (http://localhost:3000)"
else
    echo "⚠️  Dashboard service may still be starting..."
fi

# Check Nginx
if curl -s http://localhost/health > /dev/null 2>&1; then
    echo "✅ Nginx proxy is running (http://localhost)"
else
    echo "⚠️  Nginx proxy may still be starting..."
fi

echo ""
echo "🎉 Services are starting!"
echo ""
echo "📍 Access points:"
echo "   - Dashboard (via Nginx): http://localhost"
echo "   - Dashboard (direct):    http://localhost:3000"
echo "   - API (direct):         http://localhost:8000"
echo ""
echo "📊 View logs:"
echo "   $COMPOSE_CMD -f docker-compose.production.yml logs -f"
echo ""
echo "🛑 Stop services:"
echo "   $COMPOSE_CMD -f docker-compose.production.yml down"
echo ""
