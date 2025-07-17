@echo off
echo 🚀 Starting B2B Agent with MongoDB Atlas...

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.atlas.yml down

REM Build and start services
echo 🔨 Building and starting services...
docker-compose -f docker-compose.atlas.yml up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose -f docker-compose.atlas.yml ps

echo ✅ Services started! Check logs with: docker-compose -f docker-compose.atlas.yml logs -f holidays_b2b-node
echo 🌐 MongoDB Atlas connection configured
echo 📊 Redis running locally
pause 