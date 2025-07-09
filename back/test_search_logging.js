const axios = require('axios');

// Test search API with logging
async function testSearchAPI() {
  try {
    console.log('=== TESTING SEARCH API WITH LOGGING ===');
    
    const searchPayload = {
      details: [
        {
          adult_count: 2,
          child_count: 0
        }
      ],
      area: {
        id: "city_1",
        type: "city",
        name: "Mumbai"
      },
      checkindate: "2024-12-25",
      checkoutdate: "2024-12-26",
      page: 1,
      perPage: 5,
      currentHotelsCount: 0
    };

    console.log('Search Payload:', JSON.stringify(searchPayload, null, 2));

    const response = await axios.post('http://localhost:3334/api/hotels/search', searchPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });

    console.log('=== SEARCH API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('=== END SEARCH API RESPONSE ===');

  } catch (error) {
    console.error('Error testing search API:', error.response?.data || error.message);
  }
}

// Test packages API with logging
async function testPackagesAPI() {
  try {
    console.log('=== TESTING PACKAGES API WITH LOGGING ===');
    
    const packagesPayload = {
      hotelId: "hibk", // Use the hotel ID from your example
      checkindate: "2024-12-25",
      checkoutdate: "2024-12-26",
      details: [
        {
          adult_count: 2,
          child_count: 0
        }
      ]
    };

    console.log('Packages Payload:', JSON.stringify(packagesPayload, null, 2));

    const response = await axios.post('http://localhost:3334/api/hotels/packages', packagesPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });

    console.log('=== PACKAGES API RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    console.log('=== END PACKAGES API RESPONSE ===');

  } catch (error) {
    console.error('Error testing packages API:', error.response?.data || error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Starting API tests...\n');
  
  // Uncomment the test you want to run
  // await testSearchAPI();
  await testPackagesAPI();
  
  console.log('\nTests completed!');
}

runTests(); 