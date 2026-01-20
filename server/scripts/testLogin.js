const axios = require('axios');

async function testLogin() {
  try {
    console.log('Attempting login with BAD HEADER...');
    const response = await axios.post('http://localhost:3000/auth/login', {
      email: 'admin@bbc.com',
      password: 'admin123'
    }, {
      headers: { 'Authorization': 'Bearer invalid_garbage_token_123' }
    });
    console.log('Login Success:', response.status);
    console.log('Data:', response.data);
  } catch (error) {
    if (error.response) {
      console.error('Login Failed with Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Login Error:', error.message);
    }
  }
}

testLogin();
