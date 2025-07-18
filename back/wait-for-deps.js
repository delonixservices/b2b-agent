const connectDB = require('./config/mongo');
const { getRedisClient } = require('./loaders/redis');

const waitForDependencies = async () => {
  console.log('Waiting for dependencies to be ready...');
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    
    // Test Redis connection if configured
    if (process.env.REDIS_HOST || process.env.REDIS_URL) {
      console.log('Testing Redis connection...');
      const redisClient = await getRedisClient();
      if (redisClient) {
        await redisClient.ping();
        console.log('✅ Redis connected successfully');
      } else {
        console.log('⚠️ Redis not available, continuing without Redis');
      }
    } else {
      console.log('ℹ️ Redis not configured, skipping Redis connection');
    }
    
    console.log('✅ All dependencies are ready');
  } catch (error) {
    console.error('❌ Failed to initialize dependencies:', error);
    throw error;
  }
};

module.exports = waitForDependencies; 