const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/auth/login', {
      email: 'admin@bbc.com',
      password: 'admin123'
    });
    console.log('SUCCESS:', response.data);
  } catch (error) {
    console.log('Status:', error.response?.status);
    console.log('Response:', error.response?.data);
    console.log('Error message:', error.message);
  }
}

testLogin();
