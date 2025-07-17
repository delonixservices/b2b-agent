// Environment Configuration Checker
const checkEnvironment = () => {
  console.log('=== Environment Configuration ===');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('PORT:', process.env.PORT || 'not set');
  console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'set' : 'not set');
  console.log('MONGO_URI:', process.env.MONGO_URI ? 'set' : 'not set');
  console.log('REDIS_HOST:', process.env.REDIS_HOST || 'not set');
  console.log('REDIS_PORT:', process.env.REDIS_PORT || 'not set');
  console.log('================================');
};

module.exports = checkEnvironment; 