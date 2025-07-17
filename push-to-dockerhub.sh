#!/bin/bash

# Docker Build and Push Script for B2B Agent
# This script builds and pushes the Docker image to Docker Hub

set -e

IMAGE_NAME="delonixservices/b2b-node"
VERSION="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Starting Docker build and push process..."

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Login to Docker Hub
print_status "Logging into Docker Hub..."
if ! docker login; then
    print_error "Failed to login to Docker Hub"
    exit 1
fi
print_success "Logged into Docker Hub"

# Build the Docker image
print_status "Building Docker image..."
if ! docker build -t ${IMAGE_NAME}:${VERSION} ./back; then
    print_error "Failed to build Docker image"
    exit 1
fi
print_success "Docker image built successfully"

# Push to Docker Hub
print_status "Pushing image to Docker Hub..."
if ! docker push ${IMAGE_NAME}:${VERSION}; then
    print_error "Failed to push image to Docker Hub"
    exit 1
fi
print_success "Image pushed to Docker Hub successfully"

print_success "Build and push process completed!"
print_status "Image: ${IMAGE_NAME}:${VERSION}"
print_status "Repository: https://hub.docker.com/repository/docker/delonixservices/b2b-node" 