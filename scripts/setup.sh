#!/bin/bash

# Enterprise AI Development Platform - Setup Script

set -e

echo "🚀 Setting up Enterprise AI Development Platform..."

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3.9+ is required but not installed."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 16+ is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }

# Create virtual environment
echo "📦 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Setup environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your API keys and configuration"
fi

# Start infrastructure services
echo "🐳 Starting infrastructure services (PostgreSQL, Redis, MinIO)..."
docker-compose up -d postgres redis minio

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if PostgreSQL is ready
echo "🔍 Checking PostgreSQL connection..."
until docker-compose exec postgres pg_isready -U postgres; do
  echo "PostgreSQL is unavailable - sleeping..."
  sleep 2
done

# Run database migrations
echo "🗄️ Running database migrations..."
python -c "
import asyncio
from services.api.database import init_db
asyncio.run(init_db())
print('✅ Database initialized successfully')
"

# Create MinIO bucket (optional)
echo "🪣 Setting up MinIO bucket..."
python -c "
import boto3
from botocore.exceptions import NoCredentialsError
import os
from dotenv import load_dotenv

load_dotenv()

try:
    s3 = boto3.client(
        's3',
        endpoint_url='http://localhost:9000',
        aws_access_key_id='minioadmin',
        aws_secret_access_key='minioadmin'
    )
    
    bucket_name = 'enterprise-ai-platform-artifacts'
    try:
        s3.create_bucket(Bucket=bucket_name)
        print(f'✅ Created MinIO bucket: {bucket_name}')
    except s3.exceptions.BucketAlreadyOwnedByYou:
        print(f'✅ MinIO bucket already exists: {bucket_name}')
        
except NoCredentialsError:
    print('⚠️  Could not setup MinIO bucket - credentials not configured')
except Exception as e:
    print(f'⚠️  MinIO setup failed: {e}')
"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your API keys and configuration"
echo "2. Start the API server: python -m services.api.main"
echo "3. Start the web dashboard: cd services/web && npm install && npm start"
echo "4. Visit http://localhost:3000 to access the platform"
echo ""
echo "🔗 Useful URLs:"
echo "- API Documentation: http://localhost:8000/docs"
echo "- MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo "- Database: localhost:5432 (postgres/postgres)"
echo "- Redis: localhost:6379"
echo ""
echo "📚 For development guides, see the README.md file"
