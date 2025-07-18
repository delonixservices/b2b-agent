// Test Redis connection with password authentication
// Set these environment variables before running:
// REDIS_HOST=localhost
// REDIS_PORT=6379
// REDIS_AUTH=1956

const { getRedisClient, closeRedisClient } = require('./loaders/redis');

async function testRedisWithPassword() {
  console.log('Testing Redis connection with password authentication...');
  console.log('Configuration:');
  console.log(`- Host: ${process.env.REDIS_HOST || 'localhost'}`);
  console.log(`- Port: ${process.env.REDIS_PORT || 6379}`);
  console.log(`- Password: ${process.env.REDIS_AUTH ? '***' : 'none'}`);
  console.log('---');
  
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
      
      // Test autosuggest cache key (similar to what the app uses)
      const testData = [
        { name: 'Test Hotel', id: '123', hotelCount: 5 },
        { name: 'Test City', id: '456', hotelCount: 10 }
      ];
      await client.setEx('autosuggest:test', 7200, JSON.stringify(testData));
      const cachedData = await client.get('autosuggest:test');
      console.log('✅ Autosuggest cache test passed:', JSON.parse(cachedData));
      
      // Clean up
      await client.del('test:key');
      await client.del('test:expire');
      await client.del('autosuggest:test');
      console.log('✅ Redis cleanup completed');
      
    } else {
      console.log('❌ Failed to create Redis client');
    }
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('WRONGPASS')) {
      console.error('💡 The password is incorrect. Please check REDIS_AUTH value.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Redis server is not running. Please start Redis server.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('💡 Cannot find Redis host. Please check REDIS_HOST value.');
    }
  } finally {
    await closeRedisClient();
    console.log('Redis connection closed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRedisWithPassword();
}

module.exports = { testRedisWithPassword }; 