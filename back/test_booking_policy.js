const axios = require('axios');

// Test the booking policy endpoint
async function testBookingPolicy() {
  try {
    const testData = {
      "hotelId": "68690388113a07eab6dfefb7",
      "bookingKey": "1",
      "search": {
        "check_out_date": "2025-07-06",
        "child_count": 0,
        "room_count": 1,
        "source_market": "IN",
        "currency": "INR",
        "locale": "en-US",
        "hotel_id_list": ["104954"],
        "adult_count": 2,
        "check_in_date": "2025-07-05"
      },
      "transaction_id": "bc191b7863814f4c9f06ae3333823d39"
    };

    console.log('Testing booking policy endpoint...');
    console.log('Request data:', JSON.stringify(testData, null, 2));

    const response = await axios.post('http://localhost:3000/api/hotels/bookingpolicy', testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    // Validate the response structure
    const data = response.data;
    
    if (data.data && 
        data.data.booking_policy_id && 
        data.data.package && 
        data.transaction_identifier && 
        data.api === "post::bookingpolicy" && 
        data.version === "v1") {
      console.log('✅ Response structure is correct!');
    } else {
      console.log('❌ Response structure is incorrect!');
    }

  } catch (error) {
    console.error('Error testing booking policy:', error.response?.data || error.message);
  }
}

// Run the test
testBookingPolicy(); 