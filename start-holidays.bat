@echo off
echo 🚀 Starting B2B Agent Holidays Services...

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose -f docker-compose.holidays.yml down

REM Build and start services
echo 🔨 Building and starting services...
docker-compose -f docker-compose.holidays.yml up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service status
echo 📊 Checking service status...
docker-compose -f docker-compose.holidays.yml ps

echo ✅ Services started! Check logs with: docker-compose -f docker-compose.holidays.yml logs -f holidays_b2b-node
pause 