// Environment Configuration Checker
const checkEnvironment = () => {
  console.log('=== Environment Configuration ===');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('PORT:', process.env.PORT || 'not set');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'set' : 'not set');
  console.log('MONGO_URI:', process.env.MONGO_URI ? 'set' : 'not set');
  console.log('MONGO_URL:', process.env.MONGO_URL ? 'set' : 'not set');
  console.log('REDIS_HOST:', process.env.REDIS_HOST || 'not set');
  console.log('REDIS_PORT:', process.env.REDIS_PORT || 'not set');
  
  // Check which MongoDB connection string is being used
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || 'mongodb+srv://admin:tKPuRWiVHPH9xTdA@atlascluster.xw9oe1k.mongodb.net/b2b?retryWrites=true&w=majority&appName=AtlasCluster';
  if (mongoUri) {
    console.log('MongoDB Connection:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    if (!process.env.MONGODB_URI && !process.env.MONGO_URI && !process.env.MONGO_URL) {
      console.log('⚠️  Using hardcoded MongoDB Atlas connection string');
    }
  } else {
    console.log('MongoDB Connection: not configured');
  }
  console.log('================================');
};

module.exports = checkEnvironment; 