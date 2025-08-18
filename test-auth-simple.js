const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_CREDENTIALS = {
  email: 'admin@demo.com',
  password: 'password123'
};

async function testAuth() {
  try {
    console.log('Testing authentication...');
    console.log('URL:', `${BASE_URL}/auth/signin`);
    console.log('Credentials:', TEST_CREDENTIALS);
    
    const response = await axios.post(`${BASE_URL}/auth/signin`, TEST_CREDENTIALS);
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.token) {
      console.log('✅ Authentication successful!');
      console.log('Token:', response.data.data.token);
    } else {
      console.log('❌ Authentication failed - No token received');
    }
  } catch (error) {
    console.error('❌ Authentication error:');
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testAuth();
