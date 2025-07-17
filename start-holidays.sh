#!/bin/bash

echo "🚀 Starting B2B Agent Holidays Services..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.holidays.yml down

# Remove any existing volumes (optional - uncomment if you want fresh data)
# echo "🗑️  Removing existing volumes..."
# docker-compose -f docker-compose.holidays.yml down -v

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.holidays.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose -f docker-compose.holidays.yml ps

echo "✅ Services started! Check logs with: docker-compose -f docker-compose.holidays.yml logs -f holidays_b2b-node" 