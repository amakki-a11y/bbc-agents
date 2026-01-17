const axios = require('axios');

const API_URL = 'http://localhost:3000';
const EMAIL = `test_${Date.now()}@example.com`;
const PASSWORD = 'password123';

async function runTest() {
    try {
        // 1. Register
        console.log('1. Registering new user...');
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = regRes.data.token;
        console.log('✅ Registered & Logged in. Token:', token.substring(0, 10) + '...');
        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Task (Parent)
        console.log('\n2. Creating Parent Task...');
        const taskRes = await axios.post(`${API_URL}/api/tasks`, {
            title: "Parent Task for Action Items",
            priority: "high"
        }, { headers });
        const textTask = taskRes.data;
        console.log('✅ Task Created ID:', textTask.id);
        const TASK_ID = textTask.id;

        // 3. Create Action Item
        console.log('\n3. Creating Action Item...');
        const createRes = await axios.post(`${API_URL}/api/tasks/details/${TASK_ID}/action-items`, {
            content: "Test Action Item",
            assignee_id: null
        }, { headers });
        const item = createRes.data;
        console.log('✅ Created Item:', item);

        if (!item.id) throw new Error("No ID returned");

        // 4. Update Status
        console.log('\n4. Updating Status (Complete)...');
        const updateRes1 = await axios.put(`${API_URL}/api/tasks/details/action-items/${item.id}`, {
            is_complete: true
        }, { headers });
        console.log('✅ Updated Status:', updateRes1.data.is_complete);
        if (updateRes1.data.is_complete !== true) throw new Error("Status update failed");

        // 5. Update Content
        console.log('\n5. Updating Content (Rename)...');
        const updateRes2 = await axios.put(`${API_URL}/api/tasks/details/action-items/${item.id}`, {
            content: "Renamed Item"
        }, { headers });
        console.log('✅ Updated Content:', updateRes2.data.title);
        if (updateRes2.data.title !== "Renamed Item") throw new Error("Content update failed");

        // 6. Verify Logs (Optional, fetch task details)
        console.log('\n6. Fetching Details to verify logs...');
        const detailsRes = await axios.get(`${API_URL}/api/tasks/details/${TASK_ID}`, { headers });
        const logs = detailsRes.data.activities;
        console.log('✅ Activity Count:', logs.length);
        // Expect at least: Task create, Action Create, Action Update Status, Action Update Content
        const hasActionLog = logs.some(l => l.content.includes("added action item"));
        if (!hasActionLog) console.warn("⚠️ Warning: Creation log not found in activity feed");

        // 7. Delete
        console.log('\n7. Deleting Action Item...');
        await axios.delete(`${API_URL}/api/tasks/details/action-items/${item.id}`, { headers });
        console.log('✅ Deleted successfully');

        console.log('\n🎉 ALL BACKEND TESTS PASSED');

    } catch (error) {
        console.error('❌ Test Failed:', error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

runTest();
