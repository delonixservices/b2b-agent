@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Docker Image Size Comparison
echo ========================================

echo.
echo Current Image:
docker images delonixservices/b2b-node:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo.
echo Building optimized version...
docker build -f ./back/Dockerfile.optimized -t delonixservices/b2b-node:optimized ./back

echo.
echo Building minimal version...
docker build -f ./back/Dockerfile.minimal -t delonixservices/b2b-node:minimal ./back

echo.
echo ========================================
echo Size Comparison:
echo ========================================
docker images delonixservices/b2b-node --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo.
echo ========================================
echo Recommendations:
echo ========================================
echo 1. Current (53.9MB) - Good for production
echo 2. Optimized - Slightly smaller, more secure
echo 3. Minimal - Smallest size, but less debugging tools
echo.
echo Your current size of 53.9MB is EXCELLENT for a Node.js app!
echo ======================================== 