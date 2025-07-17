# EasyPanel Deployment Guide

## ✅ Fixed Issues

### 1. Health Check Endpoint
- **Added**: Comprehensive `/health` endpoint in `app.js`
- **Features**: 
  - Checks MongoDB connection status
  - Checks Redis connection status (if configured)
  - Returns detailed service health information
  - Returns appropriate HTTP status codes (200 for healthy, 503 for degraded)

### 2. Docker HEALTHCHECK
- **Updated**: Dockerfile with proper HEALTHCHECK
- **Features**:
  - Uses `curl` for reliable health checks
  - Checks every 10 seconds
  - 3-second timeout
  - 5-second start period
  - 3 retries before marking unhealthy

### 3. Port Configuration
- **Fixed**: Port mismatch between app.js and Dockerfile
- **Now**: Both use port 3335 consistently
- **Environment**: `PORT=3335` set in Dockerfile

### 4. Dependency Management
- **Added**: `wait-for-deps.js` utility
- **Features**:
  - Waits for MongoDB to be ready (10 retries, 5s intervals)
  - Waits for Redis to be ready (5 retries, 3s intervals)
  - Graceful handling of missing Redis configuration
  - Detailed logging of connection attempts

### 5. Enhanced Application Startup
- **Updated**: `app.js` initialization
- **Features**:
  - Uses dependency waiting utility
  - Better error handling
  - Comprehensive health checks

## 🚀 EasyPanel Configuration

### Service Settings
1. **Internal Port**: `3335`
2. **External Port**: Your choice (e.g., `3335`)
3. **Environment Variables**: Set according to your `env.example`

### Required Environment Variables
```bash
NODE_ENV=production
PORT=3335
MONGODB_URI=your_mongodb_connection_string
# Optional Redis configuration
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_AUTH=your_redis_password
```

## 🧪 Testing

### Local Testing with Docker Compose
```bash
# Copy the example file
cp docker-compose.example.yml docker-compose.yml

# Edit environment variables in docker-compose.yml

# Start all services
docker-compose up -d

# Check health
curl http://localhost:3335/health
```

### Manual Health Check
```bash
# Test the health endpoint
curl -f http://localhost:3335/health

# Expected response:
{
  "message": "Server is running",
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "port": 3335,
  "environment": "production",
  "services": {
    "mongodb": {
      "status": "connected",
      "readyState": 1
    },
    "redis": {
      "status": "connected"
    }
  }
}
```

## 🔧 Troubleshooting

### Container Won't Start
1. Check logs: `docker logs <container_name>`
2. Verify environment variables are set correctly
3. Ensure MongoDB and Redis are accessible

### Health Check Failing
1. Check if `/health` endpoint responds: `curl http://localhost:3335/health`
2. Verify database connections
3. Check container logs for errors

### Port Issues
1. Confirm EasyPanel internal port is set to `3335`
2. Verify `EXPOSE 3335` in Dockerfile
3. Check if port is already in use

## 📁 Files Modified/Created

### Modified Files
- `app.js` - Added health endpoint, dependency waiting, port fix
- `Dockerfile` - Added curl, improved HEALTHCHECK, port consistency

### New Files
- `wait-for-deps.js` - Dependency waiting utility
- `start.sh` - Alternative startup script
- `docker-compose.example.yml` - Local testing setup
- `EASYPANEL_SETUP.md` - This guide

## 🎯 Next Steps

1. **Deploy to EasyPanel**:
   - Upload your code
   - Set environment variables
   - Configure port 3335
   - Deploy

2. **Monitor Health**:
   - Check `/health` endpoint regularly
   - Monitor container logs
   - Set up alerts for health check failures

3. **Scale if Needed**:
   - EasyPanel should now properly detect healthy containers
   - Load balancing will work correctly
   - Auto-restart on failures

## 📞 Support

If you encounter issues:
1. Check container logs first
2. Verify all environment variables are set
3. Test health endpoint manually
4. Ensure dependencies (MongoDB/Redis) are accessible 