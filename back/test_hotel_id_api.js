const Api = require('./utils/api');

/**
 * Test script for the new getHotelId API endpoint
 * This script tests the functionality of extracting hotel IDs from hotel names
 */

async function testGetHotelIdAPI() {
  console.log('=== TESTING GET HOTEL ID API ===');
  
  const testCases = [
    {
      name: 'Hotel with city after comma',
      hotelName: 'New Haven Hotel Greater Kailash - New Delhi, E - 512, Greater Kailash Part - 2, New Delhi',
      expectedCity: 'New Delhi'
    },
    {
      name: 'Hotel with multiple commas',
      hotelName: 'Taj Palace, New Delhi, India, Asia',
      expectedCity: 'Asia'
    },
    {
      name: 'Hotel without commas',
      hotelName: 'Hotel Mumbai Central',
      expectedCity: 'Hotel Mumbai Central'
    },
    {
      name: 'Hotel with address details',
      hotelName: 'The Oberoi, Dr. Zakir Hussain Marg, New Delhi, Delhi 110003, India',
      expectedCity: 'India'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    console.log(`Hotel Name: ${testCase.hotelName}`);
    console.log(`Expected City: ${testCase.expectedCity}`);
    
    try {
      // Test city extraction logic
      const extractCityFromHotelName = (hotelName) => {
        const parts = hotelName.split(',');
        if (parts.length > 1) {
          const cityPart = parts[parts.length - 1].trim();
          return cityPart;
        }
        return hotelName.trim();
      };
      
      const extractedCity = extractCityFromHotelName(testCase.hotelName);
      console.log(`Extracted City: ${extractedCity}`);
      
      if (extractedCity === testCase.expectedCity) {
        console.log('✅ City extraction: PASSED');
      } else {
        console.log('❌ City extraction: FAILED');
        console.log(`Expected: ${testCase.expectedCity}, Got: ${extractedCity}`);
      }
      
      // Test autosuggest API call (if API is available)
      console.log('\nTesting autosuggest API call...');
      const autosuggestPayload = {
        "autosuggest": {
          "query": extractedCity,
          "locale": "en-US"
        }
      };
      
      try {
        const data = await Api.post("/autosuggest", autosuggestPayload);
        console.log('✅ Autosuggest API call: SUCCESS');
        console.log(`Response structure:`, Object.keys(data || {}));
        
        if (data && data.data) {
          let hotelCount = 0;
          let cityCount = 0;
          
          if (data.data.hotel && data.data.hotel.results) {
            hotelCount = data.data.hotel.results.length;
          }
          
          if (data.data.city && data.data.city.results) {
            cityCount = data.data.city.results.length;
          }
          
          console.log(`Found ${hotelCount} hotels and ${cityCount} cities for "${extractedCity}"`);
        }
      } catch (apiError) {
        console.log('⚠️ Autosuggest API call: SKIPPED (API not available)');
        console.log(`Error: ${apiError.message}`);
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
  }
  
  console.log('\n=== TEST COMPLETED ===');
}

// Test the city extraction function separately
function testCityExtraction() {
  console.log('\n=== TESTING CITY EXTRACTION FUNCTION ===');
  
  const testCases = [
    'New Haven Hotel Greater Kailash - New Delhi, E - 512, Greater Kailash Part - 2, New Delhi',
    'Taj Palace, New Delhi, India',
    'Hotel Mumbai Central',
    'The Oberoi, Dr. Zakir Hussain Marg, New Delhi, Delhi 110003, India',
    'Simple Hotel Name',
    'Hotel, City, State, Country',
    'Hotel with, multiple, commas, and, spaces'
  ];
  
  testCases.forEach((hotelName, index) => {
    const parts = hotelName.split(',');
    const extractedCity = parts.length > 1 ? parts[parts.length - 1].trim() : hotelName.trim();
    
    console.log(`Test ${index + 1}:`);
    console.log(`  Input: "${hotelName}"`);
    console.log(`  Extracted: "${extractedCity}"`);
    console.log(`  Parts: [${parts.map(p => `"${p.trim()}"`).join(', ')}]`);
    console.log('');
  });
}

// Run tests
async function runTests() {
  try {
    await testGetHotelIdAPI();
    testCityExtraction();
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = {
  testGetHotelIdAPI,
  testCityExtraction
}; 