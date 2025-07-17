#!/bin/bash

echo "🚀 Starting B2B Agent with MongoDB Atlas..."

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.atlas.yml down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.atlas.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose -f docker-compose.atlas.yml ps

echo "✅ Services started! Check logs with: docker-compose -f docker-compose.atlas.yml logs -f holidays_b2b-node"
echo "🌐 MongoDB Atlas connection configured"
echo "📊 Redis running locally" 