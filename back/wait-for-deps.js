const mongoose = require('mongoose');
const { getRedisClient } = require('./loaders/redis');

async function waitForDependencies() {
  console.log('🔍 Checking dependencies...');
  
  // Wait for MongoDB
  let mongoRetries = 10;
  // Hardcoded MongoDB Atlas connection string
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb+srv://admin:tKPuRWiVHPH9xTdA@atlascluster.xw9oe1k.mongodb.net/b2b?retryWrites=true&w=majority&appName=AtlasCluster';
  
  console.log(`🔗 Attempting to connect to MongoDB: ${mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
  
  while (mongoRetries > 0) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      });
      console.log('✅ MongoDB is ready');
      break;
    } catch (error) {
      mongoRetries--;
      console.log(`⏳ MongoDB not ready, retrying... (${mongoRetries} attempts left)`);
      console.log(`   Error: ${error.message}`);
      if (mongoRetries === 0) {
        console.error('❌ MongoDB connection failed after 10 attempts');
        console.error('   Please check:');
        console.error('   1. MongoDB service is running');
        console.error('   2. Connection string is correct');
        console.error('   3. Network connectivity');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Wait for Redis (optional - only if REDIS_HOST is set)
  if (process.env.REDIS_HOST || process.env.REDIS_URL) {
    let redisRetries = 5;
    while (redisRetries > 0) {
      try {
        const redisClient = await getRedisClient();
        await redisClient.ping();
        console.log('✅ Redis is ready');
        break;
      } catch (error) {
        redisRetries--;
        if (redisRetries === 0) {
          console.error('❌ Redis connection failed after 5 attempts');
          console.log('⚠️  Continuing without Redis...');
          break;
        }
        console.log(`⏳ Redis not ready, retrying... (${redisRetries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  } else {
    console.log('ℹ️  Redis not configured, skipping...');
  }
  
  console.log('🚀 All dependencies are ready!');
}

module.exports = waitForDependencies; 