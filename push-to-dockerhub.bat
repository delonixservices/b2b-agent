@echo off
setlocal enabledelayedexpansion

REM Docker Build and Push Script for B2B Agent
REM This script builds and pushes the Docker image to Docker Hub

set "IMAGE_NAME=delonixservices/b2b-node"
set "VERSION=latest"

REM Colors for output
set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

echo %BLUE%[INFO]%NC% Starting Docker build and push process...

REM Check if Docker is running
echo %BLUE%[INFO]%NC% Checking Docker status...
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Docker is not running. Please start Docker and try again.
    exit /b 1
)
echo %GREEN%[SUCCESS]%NC% Docker is running

REM Login to Docker Hub
echo %BLUE%[INFO]%NC% Logging into Docker Hub...
docker login
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Failed to login to Docker Hub
    exit /b 1
)
echo %GREEN%[SUCCESS]%NC% Logged into Docker Hub

REM Build the Docker image
echo %BLUE%[INFO]%NC% Building Docker image...
docker build -t %IMAGE_NAME%:%VERSION% ./back
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Failed to build Docker image
    exit /b 1
)
echo %GREEN%[SUCCESS]%NC% Docker image built successfully

REM Push to Docker Hub
echo %BLUE%[INFO]%NC% Pushing image to Docker Hub...
docker push %IMAGE_NAME%:%VERSION%
if errorlevel 1 (
    echo %RED%[ERROR]%NC% Failed to push image to Docker Hub
    exit /b 1
)
echo %GREEN%[SUCCESS]%NC% Image pushed to Docker Hub successfully

echo %GREEN%[SUCCESS]%NC% Build and push process completed!
echo %BLUE%[INFO]%NC% Image: %IMAGE_NAME%:%VERSION%
echo %BLUE%[INFO]%NC% Repository: https://hub.docker.com/repository/docker/delonixservices/b2b-node 