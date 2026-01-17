const axios = require('axios');

const API_URL = 'http://localhost:3000';
let token = '';

const runTest = async () => {
    try {
        console.log('--- Starting Verification ---');

        console.log('1. Registering User...');
        const email = `test${Date.now()}@example.com`;
        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, {
                email: email,
                password: 'password123'
            });
            token = regRes.data.token;
            console.log('✅ Registered:', email);
        } catch (e) {
            console.log('❌ Registration failed:', e.response?.data || e.message);
            return;
        }

        console.log('2. Creating Manual Task...');
        try {
            const taskRes = await axios.post(`${API_URL}/api/tasks`, {
                title: 'Manual Task',
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.log('✅ Created Task:', taskRes.data.title);
        } catch (e) {
            console.log('❌ Manual Task failed:', e.response?.data || e.message);
        }

        console.log('3. Testing AI Command (Mock "Buy milk")...');
        try {
            const aiRes = await axios.post(`${API_URL}/ai/command`, {
                command: 'Buy milk'
            }, { headers: { Authorization: `Bearer ${token}` } });
            console.log('✅ AI Response:', aiRes.data.message);
            console.log('   Result:', aiRes.data.result?.title);
        } catch (e) {
            console.log('❌ AI Command failed (Expected if no API Key? No, mock should trigger):', e.response?.data || e.message);
        }

        console.log('4. Fetching All Tasks...');
        try {
            const listRes = await axios.get(`${API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } });
            console.log(`✅ Found ${listRes.data.length} tasks.`);
            listRes.data.forEach(t => console.log(`   - ${t.title} (${t.status})`));

            const hasMilk = listRes.data.some(t => t.title === 'Buy milk');
            if (hasMilk) console.log('✅ Verification SUCCESS: "Buy milk" task found.');
            else console.log('❌ Verification FAILED: "Buy milk" task missing.');

        } catch (e) {
            console.log('❌ Fetch failed:', e.response?.data || e.message);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
};

runTest();
