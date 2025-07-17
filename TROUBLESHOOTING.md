# Troubleshooting Guide

## MongoDB Connection Issues

### Problem
The application is failing to connect to MongoDB with the error:
```
⏳ MongoDB not ready, retrying... (X attempts left)
```

### Root Cause
The issue is caused by a mismatch between the service names in your docker-compose configuration and the MongoDB connection string in the environment variables.

### Solution

#### Option 1: Use MongoDB Atlas Configuration (Recommended for Cloud Setup)

If you're using MongoDB Atlas (cloud-hosted MongoDB):

1. **Stop any running containers:**
   ```bash
   docker-compose down
   ```

2. **Use the Atlas configuration:**
   ```bash
   # On Linux/Mac:
   ./start-atlas.sh
   
   # On Windows:
   start-atlas.bat
   ```

3. **Or manually run:**
   ```bash
   docker-compose -f docker-compose.atlas.yml up --build -d
   ```

#### Option 2: Use the Holidays Configuration (Local MongoDB)

1. **Stop any running containers:**
   ```bash
   docker-compose down
   ```

2. **Use the holidays configuration:**
   ```bash
   # On Linux/Mac:
   ./start-holidays.sh
   
   # On Windows:
   start-holidays.bat
   ```

3. **Or manually run:**
   ```bash
   docker-compose -f docker-compose.holidays.yml up --build -d
   ```

#### Option 2: Fix Your Current Configuration

If you want to use your existing docker-compose file, update the environment variables:

1. **Find your current docker-compose file** and update the `MONGODB_URI`:
   ```yaml
   environment:
     - MONGODB_URI=mongodb://YOUR_MONGODB_SERVICE_NAME:27017/b2b_agent
   ```

2. **Replace `YOUR_MONGODB_SERVICE_NAME`** with the actual MongoDB service name in your docker-compose file.

#### Option 3: Local Development Setup

If you want to run MongoDB locally (not recommended if you have Atlas):

1. **Install MongoDB locally** or use Docker:
   ```bash
   docker run -d --name mongodb -p 27017:27017 mongo:7.0
   ```

2. **Set the environment variable:**
   ```bash
   export MONGODB_URI=mongodb://localhost:27017/b2b_agent
   ```

3. **Run the application:**
   ```bash
   cd back
   npm start
   ```

### Verification Steps

1. **Check if MongoDB is running:**
   ```bash
   docker ps | grep mongo
   ```

2. **Test MongoDB connection:**
   ```bash
   docker exec -it YOUR_MONGODB_CONTAINER mongosh
   ```

3. **Check application logs:**
   ```bash
   docker-compose -f docker-compose.holidays.yml logs -f holidays_b2b-node
   ```

4. **Test the health endpoint:**
   ```bash
   curl http://localhost:3335/health
   ```

### Common Issues

#### Issue 1: Service Names Mismatch
- **Symptoms:** Application can't find MongoDB service
- **Solution:** Ensure service names in docker-compose match the connection string

#### Issue 2: Network Connectivity
- **Symptoms:** Connection timeout errors
- **Solution:** Ensure all services are on the same Docker network

#### Issue 3: MongoDB Not Ready
- **Symptoms:** MongoDB container is starting but not ready
- **Solution:** Add health checks and proper `depends_on` configuration

#### Issue 4: Port Conflicts
- **Symptoms:** Port already in use errors
- **Solution:** Change ports in docker-compose or stop conflicting services

### Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/b2b_agent` |
| `REDIS_HOST` | Redis host address | `localhost` or `redis` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_AUTH` | Redis password | `1956` |
| `NODE_ENV` | Node environment | `production` or `development` |
| `PORT` | Application port | `3335` |

### Debug Commands

```bash
# Check all running containers
docker ps

# Check container logs
docker logs CONTAINER_NAME

# Check network connectivity
docker network ls
docker network inspect NETWORK_NAME

# Check MongoDB status
docker exec -it CONTAINER_NAME mongosh --eval "db.adminCommand('ping')"

# Check Redis status
docker exec -it CONTAINER_NAME redis-cli -a PASSWORD ping
```

### Getting Help

If you're still experiencing issues:

1. **Check the logs:** Look for specific error messages
2. **Verify configuration:** Ensure all environment variables are set correctly
3. **Test connectivity:** Use the debug commands above
4. **Check Docker resources:** Ensure Docker has enough memory and disk space 