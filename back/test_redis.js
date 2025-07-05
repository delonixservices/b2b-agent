const { getRedisClient, closeRedisClient } = require('./loaders/redis');

async function testRedis() {
  console.log('Testing Redis connection...');
  
  try {
    const client = await getRedisClient();
    
    if (client) {
      console.log('✅ Redis client created successfully');
      
      // Test basic operations
      await client.set('test:key', 'test:value');
      const value = await client.get('test:key');
      console.log('✅ Redis get/set test passed:', value);
      
      // Test expiration
      await client.setEx('test:expire', 5, 'will expire in 5 seconds');
      console.log('✅ Redis setEx test passed');
      
      // Clean up
      await client.del('test:key');
      await client.del('test:expire');
      console.log('✅ Redis cleanup completed');
      
    } else {
      console.log('❌ Failed to create Redis client');
    }
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
  } finally {
    await closeRedisClient();
    console.log('Redis connection closed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRedis();
}

module.exports = { testRedis }; 