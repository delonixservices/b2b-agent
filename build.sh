#!/bin/bash

# B2B Agent Docker Build Script
# This script helps build and run the B2B Agent backend with Docker

set -e

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Function to build production environment
build_production() {
    print_status "Building production environment..."
    
    # Build the backend image
    docker-compose build backend
    
    print_success "Production build completed"
}

# Function to build development environment
build_development() {
    print_status "Building development environment..."
    
    # Build the development backend image
    docker-compose -f docker-compose.dev.yml build backend
    
    print_success "Development build completed"
}

# Function to start production environment
start_production() {
    print_status "Starting production environment..."
    
    # Start all services
    docker-compose up -d
    
    print_success "Production environment started"
    print_status "Services:"
    print_status "  - Backend API: http://localhost:3334"
    print_status "  - MongoDB: localhost:27017"
    print_status "  - Redis: localhost:6379"
}

# Function to start development environment
start_development() {
    print_status "Starting development environment..."
    
    # Start all services
    docker-compose -f docker-compose.dev.yml up -d
    
    print_success "Development environment started"
    print_status "Services:"
    print_status "  - Backend API: http://localhost:3334"
    print_status "  - MongoDB: localhost:27017"
    print_status "  - Redis: localhost:6379"
    print_status "  - Mongo Express: http://localhost:8081"
    print_status "  - Redis Commander: http://localhost:8082"
}

# Function to stop all services
stop_services() {
    print_status "Stopping all services..."
    
    # Stop production services
    docker-compose down 2>/dev/null || true
    
    # Stop development services
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    print_success "All services stopped"
}

# Function to show logs
show_logs() {
    local service=${1:-backend}
    local env=${2:-production}
    
    if [ "$env" = "development" ]; then
        docker-compose -f docker-compose.dev.yml logs -f $service
    else
        docker-compose logs -f $service
    fi
}

# Function to show status
show_status() {
    print_status "Production services:"
    docker-compose ps 2>/dev/null || print_warning "No production services running"
    
    echo ""
    print_status "Development services:"
    docker-compose -f docker-compose.dev.yml ps 2>/dev/null || print_warning "No development services running"
}

# Function to clean up
cleanup() {
    print_status "Cleaning up Docker resources..."
    
    # Stop and remove containers
    docker-compose down -v 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down -v 2>/dev/null || true
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    print_success "Cleanup completed"
}

# Function to show help
show_help() {
    echo "B2B Agent Docker Build Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  build-prod     Build production Docker images"
    echo "  build-dev      Build development Docker images"
    echo "  start-prod     Start production environment"
    echo "  start-dev      Start development environment"
    echo "  stop           Stop all services"
    echo "  logs [SERVICE] Show logs (default: backend)"
    echo "  status         Show service status"
    echo "  cleanup        Clean up Docker resources"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 build-prod"
    echo "  $0 start-dev"
    echo "  $0 logs mongodb"
    echo "  $0 logs backend development"
}

# Main script logic
main() {
    # Check prerequisites
    check_docker
    check_docker_compose
    
    case "${1:-help}" in
        "build-prod")
            build_production
            ;;
        "build-dev")
            build_development
            ;;
        "start-prod")
            start_production
            ;;
        "start-dev")
            start_development
            ;;
        "stop")
            stop_services
            ;;
        "logs")
            show_logs "$2" "$3"
            ;;
        "status")
            show_status
            ;;
        "cleanup")
            cleanup
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

# Run main function with all arguments
main "$@" 