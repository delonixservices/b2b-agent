# B2B Agent - Docker Setup Guide

This guide provides instructions for running the B2B Agent backend using Docker and Docker Compose.

## Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)

## Quick Start

### Production Environment

1. **Clone the repository and navigate to the project directory:**
   ```bash
   cd b2b-agent
   ```

2. **Build and start all services:**
   ```bash
   docker-compose up -d
   ```

3. **Check if all services are running:**
   ```bash
   docker-compose ps
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f backend
   ```

### Development Environment

1. **Start development environment with hot reloading:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **View development logs:**
   ```bash
   docker-compose -f docker-compose.dev.yml logs -f backend
   ```

## Services

### Core Services (Production & Development)

- **Backend API** - Node.js Express application (Port: 3334)
- **MongoDB** - Database (Port: 27017)
- **Redis** - Cache (Port: 6379)

### Development Tools (Development Only)

- **Mongo Express** - MongoDB web interface (Port: 8081)
- **Redis Commander** - Redis web interface (Port: 8082)

## Environment Configuration

### Production Environment Variables

The production environment uses the following default configuration:

- **Database**: MongoDB with database name `b2b_agent`
- **Cache**: Redis with password `1956`
- **Port**: 3334
- **Node Environment**: Production

### Development Environment Variables

The development environment uses:

- **Database**: MongoDB with database name `b2b_agent_dev`
- **Cache**: Redis with password `1956`
- **Port**: 3334
- **Node Environment**: Development
- **Hot Reloading**: Enabled with nodemon

## Customizing Environment Variables

### Method 1: Environment File

1. Create a `.env` file in the project root:
   ```bash
   cp back/env.example .env
   ```

2. Edit the `.env` file with your configuration

3. Update the docker-compose files to use the `.env` file:
   ```yaml
   env_file:
     - .env
   ```

### Method 2: Direct Environment Variables

Edit the environment variables directly in the docker-compose files:

```yaml
environment:
  - MONGODB_URI=mongodb://mongodb:27017/your_database
  - JWT_SECRET=your_jwt_secret
  - REDIS_AUTH=your_redis_password
```

## Database Management

### MongoDB

- **Production Database**: `b2b_agent`
- **Development Database**: `b2b_agent_dev`
- **Web Interface**: http://localhost:8081 (development only)
  - Username: `admin`
  - Password: `admin123`

### Redis

- **Password**: `1956`
- **Web Interface**: http://localhost:8082 (development only)

## File Uploads

Uploaded files are stored in the `./back/uploads` directory and are persisted through Docker volumes.

## Health Checks

The backend service includes a health check endpoint at `/health` that returns a 200 status when the service is running properly.

## Useful Commands

### View Service Status
```bash
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend

# Follow logs
docker-compose logs -f backend
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Rebuild Services
```bash
# Rebuild backend only
docker-compose build backend

# Rebuild all services
docker-compose build
```

### Access Container Shell
```bash
# Backend container
docker-compose exec backend sh

# MongoDB container
docker-compose exec mongodb mongosh

# Redis container
docker-compose exec redis redis-cli -a 1956
```

### Database Operations
```bash
# Backup MongoDB
docker-compose exec mongodb mongodump --db b2b_agent --out /data/backup

# Restore MongoDB
docker-compose exec mongodb mongorestore --db b2b_agent /data/backup/b2b_agent
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3334
   
   # Stop the conflicting service or change the port in docker-compose.yml
   ```

2. **Permission Issues with Uploads**
   ```bash
   # Fix permissions
   sudo chown -R $USER:$USER ./back/uploads
   ```

3. **Database Connection Issues**
   ```bash
   # Check if MongoDB is running
   docker-compose ps mongodb
   
   # Check MongoDB logs
   docker-compose logs mongodb
   ```

4. **Redis Connection Issues**
   ```bash
   # Check if Redis is running
   docker-compose ps redis
   
   # Test Redis connection
   docker-compose exec redis redis-cli -a 1956 ping
   ```

### Log Analysis

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs backend

# View logs with timestamps
docker-compose logs -t backend

# View last 100 lines
docker-compose logs --tail=100 backend
```

## Production Deployment

### Using Docker Compose

1. **Build production images:**
   ```bash
   docker-compose build
   ```

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **Set up reverse proxy (nginx):**
   ```bash
   # Example nginx configuration
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3334;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Using Docker Swarm

1. **Initialize swarm:**
   ```bash
   docker swarm init
   ```

2. **Deploy stack:**
   ```bash
   docker stack deploy -c docker-compose.yml b2b-agent
   ```

## Security Considerations

1. **Change default passwords** for MongoDB and Redis
2. **Use environment variables** for sensitive data
3. **Enable HTTPS** in production
4. **Regular security updates** for base images
5. **Network isolation** using Docker networks
6. **Resource limits** to prevent DoS attacks

## Monitoring

### Basic Monitoring Commands

```bash
# Resource usage
docker stats

# Container health
docker-compose ps

# Service logs
docker-compose logs --tail=50
```

### Recommended Monitoring Tools

- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **ELK Stack** - Log management
- **Docker Swarm** - Container orchestration

## Backup and Recovery

### Automated Backup Script

Create a backup script (`backup.sh`):

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Backup MongoDB
docker-compose exec mongodb mongodump --db b2b_agent --out /data/backup
docker cp b2b-agent-mongodb:/data/backup $BACKUP_DIR/mongodb_$DATE

# Backup Redis
docker-compose exec redis redis-cli -a 1956 BGSAVE
docker cp b2b-agent-redis:/data/dump.rdb $BACKUP_DIR/redis_$DATE.rdb

echo "Backup completed: $DATE"
```

### Restore Script

Create a restore script (`restore.sh`):

```bash
#!/bin/bash
BACKUP_DATE=$1
BACKUP_DIR="./backups"

if [ -z "$BACKUP_DATE" ]; then
    echo "Usage: $0 <backup_date>"
    exit 1
fi

# Restore MongoDB
docker cp $BACKUP_DIR/mongodb_$BACKUP_DATE b2b-agent-mongodb:/data/restore
docker-compose exec mongodb mongorestore --db b2b_agent /data/restore/b2b_agent

# Restore Redis
docker cp $BACKUP_DIR/redis_$BACKUP_DATE.rdb b2b-agent-redis:/data/dump.rdb
docker-compose restart redis

echo "Restore completed for: $BACKUP_DATE"
```

## Support

For issues and questions:

1. Check the troubleshooting section above
2. Review the application logs
3. Check the Docker documentation
4. Create an issue in the project repository 