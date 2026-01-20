const axios = require('axios');

async function test() {
  // Login first
  console.log('Logging in...');
  const loginRes = await axios.post('http://localhost:3000/auth/login', {
    email: 'admin@bbc.com',
    password: 'admin123'
  });
  const token = loginRes.data.accessToken;
  console.log('Logged in!\n');

  // Test a command that was failing
  const command = 'Burnout risk';
  console.log(`Testing: "${command}"`);
  console.log('Waiting for response (may take a while due to AI)...\n');

  try {
    const res = await axios.post(
      'http://localhost:3000/api/bot/message',
      { content: command, messageType: 'question' },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 60000 // 60 second timeout
      }
    );
    console.log('✅ SUCCESS');
    console.log('Response:', JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.log('❌ FAILED');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.code) {
      console.log('Error code:', error.code);
      console.log('Message:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

test().catch(console.error);
