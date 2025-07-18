const axios = require('axios');

async function testHealth() {
  try {
    console.log('Testing server health...');
    const response = await axios.get('http://localhost:3335/health');
    console.log('Health Response:', response.data);
  } catch (error) {
    console.error('Server not responding:', error.message);
  }
}

testHealth(); 