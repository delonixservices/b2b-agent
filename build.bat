@echo off
setlocal enabledelayedexpansion

REM B2B Agent Docker Build Script for Windows
REM This script helps build and run the B2B Agent backend with Docker

REM Colors for output (Windows 10+)
set "BLUE=[94m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

REM Function to print colored output
:print_status
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

REM Function to check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker and try again."
    exit /b 1
)
call :print_success "Docker is running"
goto :eof

REM Function to check if Docker Compose is available
:check_docker_compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit /b 1
)
call :print_success "Docker Compose is available"
goto :eof

REM Function to build production environment
:build_production
call :print_status "Building production environment..."
docker-compose build backend
if errorlevel 1 (
    call :print_error "Failed to build production environment"
    exit /b 1
)
call :print_success "Production build completed"
goto :eof

REM Function to build development environment
:build_development
call :print_status "Building development environment..."
docker-compose -f docker-compose.dev.yml build backend
if errorlevel 1 (
    call :print_error "Failed to build development environment"
    exit /b 1
)
call :print_success "Development build completed"
goto :eof

REM Function to start production environment
:start_production
call :print_status "Starting production environment..."
docker-compose up -d
if errorlevel 1 (
    call :print_error "Failed to start production environment"
    exit /b 1
)
call :print_success "Production environment started"
call :print_status "Services:"
call :print_status "  - Backend API: http://localhost:3334"
call :print_status "  - MongoDB: localhost:27017"
call :print_status "  - Redis: localhost:6379"
goto :eof

REM Function to start development environment
:start_development
call :print_status "Starting development environment..."
docker-compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
    call :print_error "Failed to start development environment"
    exit /b 1
)
call :print_success "Development environment started"
call :print_status "Services:"
call :print_status "  - Backend API: http://localhost:3334"
call :print_status "  - MongoDB: localhost:27017"
call :print_status "  - Redis: localhost:6379"
call :print_status "  - Mongo Express: http://localhost:8081"
call :print_status "  - Redis Commander: http://localhost:8082"
goto :eof

REM Function to stop all services
:stop_services
call :print_status "Stopping all services..."
docker-compose down >nul 2>&1
docker-compose -f docker-compose.dev.yml down >nul 2>&1
call :print_success "All services stopped"
goto :eof

REM Function to show logs
:show_logs
set "service=%~1"
set "env=%~2"
if "%service%"=="" set "service=backend"
if "%env%"=="" set "env=production"

if "%env%"=="development" (
    docker-compose -f docker-compose.dev.yml logs -f %service%
) else (
    docker-compose logs -f %service%
)
goto :eof

REM Function to show status
:show_status
call :print_status "Production services:"
docker-compose ps 2>nul || call :print_warning "No production services running"

echo.
call :print_status "Development services:"
docker-compose -f docker-compose.dev.yml ps 2>nul || call :print_warning "No development services running"
goto :eof

REM Function to clean up
:cleanup
call :print_status "Cleaning up Docker resources..."
docker-compose down -v >nul 2>&1
docker-compose -f docker-compose.dev.yml down -v >nul 2>&1
docker image prune -f >nul 2>&1
docker volume prune -f >nul 2>&1
call :print_success "Cleanup completed"
goto :eof

REM Function to show help
:show_help
echo B2B Agent Docker Build Script for Windows
echo.
echo Usage: %0 [COMMAND] [OPTIONS]
echo.
echo Commands:
echo   build-prod     Build production Docker images
echo   build-dev      Build development Docker images
echo   start-prod     Start production environment
echo   start-dev      Start development environment
echo   stop           Stop all services
echo   logs [SERVICE] Show logs (default: backend)
echo   status         Show service status
echo   cleanup        Clean up Docker resources
echo   help           Show this help message
echo.
echo Examples:
echo   %0 build-prod
echo   %0 start-dev
echo   %0 logs mongodb
echo   %0 logs backend development
goto :eof

REM Main script logic
:main
REM Check prerequisites
call :check_docker
if errorlevel 1 exit /b 1

call :check_docker_compose
if errorlevel 1 exit /b 1

REM Parse command
set "command=%~1"
if "%command%"=="" set "command=help"

if "%command%"=="build-prod" (
    call :build_production
) else if "%command%"=="build-dev" (
    call :build_development
) else if "%command%"=="start-prod" (
    call :start_production
) else if "%command%"=="start-dev" (
    call :start_development
) else if "%command%"=="stop" (
    call :stop_services
) else if "%command%"=="logs" (
    call :show_logs "%~2" "%~3"
) else if "%command%"=="status" (
    call :show_status
) else if "%command%"=="cleanup" (
    call :cleanup
) else if "%command%"=="help" (
    call :show_help
) else (
    call :print_error "Unknown command: %command%"
    call :show_help
    exit /b 1
)

exit /b 0 