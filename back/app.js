require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/mongo');
const checkEnvironment = require('./config/env-check');
const waitForDependencies = require('./wait-for-deps');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3335;

// Health check route
app.get('/health', async (req, res) => {
  try {
    const healthStatus = {
      message: 'Server is running',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      services: {}
    };
    
    // Check MongoDB connection
    try {
      const mongoStatus = mongoose.connection.readyState;
      healthStatus.services.mongodb = {
        status: mongoStatus === 1 ? 'connected' : 'disconnected',
        readyState: mongoStatus
      };
    } catch (error) {
      healthStatus.services.mongodb = {
        status: 'error',
        error: error.message
      };
    }
    
    // Check Redis connection (if configured)
    if (process.env.REDIS_HOST || process.env.REDIS_URL) {
      try {
        const { getRedisClient } = require('./loaders/redis');
        const redisClient = await getRedisClient();
        await redisClient.ping();
        healthStatus.services.redis = { status: 'connected' };
      } catch (error) {
        healthStatus.services.redis = {
          status: 'error',
          error: error.message
        };
      }
    } else {
      healthStatus.services.redis = { status: 'not_configured' };
    }
    
    // Determine overall health status
    const hasErrors = Object.values(healthStatus.services).some(service => 
      service.status === 'error' || service.status === 'disconnected'
    );
    
    if (hasErrors) {
      healthStatus.status = 'degraded';
      res.status(503).json(healthStatus);
    } else {
      res.status(200).json(healthStatus);
    }
  } catch (error) {
    res.status(500).json({
      message: 'Health check failed',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Initialize the application
const initializeApp = async () => {
  try {
    // Check environment configuration
    checkEnvironment();
    
    // Wait for all dependencies (MongoDB and Redis) to be ready
    await waitForDependencies();
    
    // Load routes after database connection is established
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/admin', require('./routes/admin'));
    app.use('/api/owner', require('./routes/owner'));
    app.use('/api/company', require('./routes/company'));
    app.use('/api/employees', require('./routes/employee'));
    app.use('/api/hotels', require('./routes/hotels'));
    
    // Start the server
    app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
};

// Start the application
initializeApp();
