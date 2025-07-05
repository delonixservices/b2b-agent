const { getRedisClient } = require('./loaders/redis');
const Api = require('./utils/api');

async function testRedisConnection() {
  console.log('\n=== TESTING REDIS CONNECTION ===');
  try {
    const client = await getRedisClient();
    if (client && client.isOpen) {
      console.log('✅ Redis connection successful');
      
      // Test a simple operation
      await client.set('test_key', 'test_value');
      const value = await client.get('test_key');
      console.log('✅ Redis read/write test successful:', value);
      
      await client.del('test_key');
      return true;
    } else {
      console.log('❌ Redis connection failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
    return false;
  }
}

async function testApiConnection() {
  console.log('\n=== TESTING API CONNECTION ===');
  try {
    console.log('API Service config:', {
      baseURL: process.env.HOTEL_APIURL ? 'Set' : 'Not set',
      authKey: process.env.HOTEL_APIAUTH ? 'Set' : 'Not set'
    });
    
    if (!process.env.HOTEL_APIURL || !process.env.HOTEL_APIAUTH) {
      console.log('❌ Missing API configuration');
      return false;
    }
    
    // Test with a simple query
    const testData = await Api.post("/autosuggest", {
      "autosuggest": {
        "query": "test",
        "locale": "en-US"
      }
    });
    
    console.log('✅ API connection successful');
    console.log('Response structure:', Object.keys(testData || {}));
    return true;
  } catch (error) {
    console.error('❌ API connection error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testSuggestFunction() {
  console.log('\n=== TESTING SUGGEST FUNCTION ===');
  
  // Mock request and response objects
  const mockReq = {
    body: {
      query: "test",
      page: 1,
      perPage: 10,
      currentItemsCount: 0
    },
    headers: {}
  };
  
  const mockRes = {
    json: (data) => {
      console.log('✅ Suggest function completed successfully');
      console.log('Response data length:', data.data ? data.data.length : 0);
      console.log('Response status:', data.status);
      return true;
    },
    status: (code) => ({
      json: (data) => {
        console.log('❌ Suggest function returned error status:', code);
        console.log('Error data:', data);
        return false;
      }
    })
  };
  
  const mockNext = (error) => {
    console.error('❌ Suggest function error:', error.message);
    return false;
  };
  
  try {
    const { suggest } = require('./controllers/hotelConrtoller');
    await suggest(mockReq, mockRes, mockNext);
    return true;
  } catch (error) {
    console.error('❌ Suggest function execution error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('=== STARTING DEBUG TESTS ===');
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
    HOTEL_APIURL: process.env.HOTEL_APIURL ? 'Set' : 'Not set',
    HOTEL_APIAUTH: process.env.HOTEL_APIAUTH ? 'Set' : 'Not set'
  });
  
  const redisResult = await testRedisConnection();
  const apiResult = await testApiConnection();
  const suggestResult = await testSuggestFunction();
  
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log('Redis Connection:', redisResult ? '✅ PASS' : '❌ FAIL');
  console.log('API Connection:', apiResult ? '✅ PASS' : '❌ FAIL');
  console.log('Suggest Function:', suggestResult ? '✅ PASS' : '❌ FAIL');
  
  if (!redisResult) {
    console.log('\n💡 Redis Issue: Check Redis server is running and configuration is correct');
  }
  
  if (!apiResult) {
    console.log('\n💡 API Issue: Check HOTEL_APIURL and HOTEL_APIAUTH environment variables');
  }
  
  if (!suggestResult) {
    console.log('\n💡 Suggest Function Issue: Check the logs above for specific error details');
  }
  
  console.log('\n=== DEBUG TESTS COMPLETED ===');
}

// Run the tests
runAllTests().catch(console.error); 