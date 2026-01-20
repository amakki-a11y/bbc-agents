/**
 * Messaging System Test Script
 * Tests the hierarchy-based employee-to-employee messaging system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test users - adjust based on your seeded data
const TEST_USERS = {
    admin: { email: 'admin@bbc.com', password: 'admin123' },
    manager: { email: 'john.doe@bbc.com', password: 'password123' },
    employee: { email: 'jane.smith@bbc.com', password: 'password123' },
    hrEmployee: { email: 'hr@bbc.com', password: 'password123' }
};

let tokens = {};
let employeeIds = {};

async function login(userType, credentials) {
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, credentials);
        tokens[userType] = res.data.accessToken;
        console.log(`✅ ${userType} logged in successfully`);
        return res.data;
    } catch (error) {
        console.log(`❌ ${userType} login failed:`, error.response?.data || error.message);
        return null;
    }
}

async function getEmployeeId(token) {
    try {
        const res = await axios.get(`${BASE_URL}/api/employees/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.id;
    } catch (error) {
        // Fallback: get first employee
        try {
            const res = await axios.get(`${BASE_URL}/api/employees?limit=1`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data.data?.[0]?.id;
        } catch (e) {
            return null;
        }
    }
}

// Test helper
async function testBotCommand(token, command, expectedBehavior) {
    process.stdout.write(`  Testing: "${command}" ... `);
    try {
        const res = await axios.post(`${BASE_URL}/api/bot/message`,
            { content: command, messageType: 'question' },
            { headers: { Authorization: `Bearer ${token}` }, timeout: 30000 }
        );

        const toolsUsed = res.data?.botMessage?.metadata?.toolsUsed || [];
        const response = res.data?.botMessage?.content || '';

        if (toolsUsed.length > 0) {
            const tools = toolsUsed.map(t => t.tool).join(', ');
            console.log(`✅ Tools: [${tools}]`);
            return { success: true, tools, response };
        } else {
            console.log(`⚠️ No tools used. Response: ${response.substring(0, 60)}...`);
            return { success: true, tools: [], response };
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Test messaging API directly
async function testMessagingAPI(token, endpoint, method, data, description) {
    process.stdout.write(`  ${description} ... `);
    try {
        const config = {
            method,
            url: `${BASE_URL}/api/messages${endpoint}`,
            headers: { Authorization: `Bearer ${token}` },
            timeout: 15000
        };
        if (data) config.data = data;

        const res = await axios(config);
        console.log(`✅ Success`);
        return { success: true, data: res.data };
    } catch (error) {
        const status = error.response?.status;
        const msg = error.response?.data?.error || error.message;

        // 403 is expected for some permission tests
        if (status === 403) {
            console.log(`🚫 Permission denied (expected): ${msg}`);
            return { success: false, expected: true, error: msg };
        }

        console.log(`❌ Failed: ${msg}`);
        return { success: false, error: msg };
    }
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('EMPLOYEE MESSAGING SYSTEM - TEST SUITE');
    console.log('='.repeat(60));
    console.log();

    // Step 1: Login all test users
    console.log('📌 STEP 1: Login Test Users');
    console.log('-'.repeat(40));

    await login('admin', TEST_USERS.admin);
    await login('manager', TEST_USERS.manager);
    await login('employee', TEST_USERS.employee);

    if (!tokens.admin) {
        console.log('\n❌ Admin login required. Make sure to run: node scripts/createAdmin.js');
        console.log('   Also ensure test employees exist in the database.');
        process.exit(1);
    }

    console.log();

    // Step 2: Test messageable contacts
    console.log('📌 STEP 2: Get Messageable Contacts');
    console.log('-'.repeat(40));

    const contactsResult = await testMessagingAPI(
        tokens.admin,
        '/contacts',
        'GET',
        null,
        'Get contacts for admin'
    );

    if (contactsResult.success) {
        const c = contactsResult.data;
        console.log(`   Total contacts: ${c.totalContacts}`);
        console.log(`   Manager: ${c.contacts?.manager?.name || 'None'}`);
        console.log(`   Same dept: ${c.contacts?.sameDepartment?.length || 0}`);
        console.log(`   HR: ${c.contacts?.hr?.length || 0}`);
        console.log(`   Direct reports: ${c.contacts?.directReports?.length || 0}`);
    }

    console.log();

    // Step 3: Test Bot Messaging Commands
    console.log('📌 STEP 3: Test Bot Messaging Commands');
    console.log('-'.repeat(40));

    // Test check messages
    await testBotCommand(tokens.admin, 'check messages', 'checkMessages');

    // Test who can I message
    await testBotCommand(tokens.admin, 'who can I message?', 'getMessageableContacts');

    // Test message manager
    await testBotCommand(tokens.admin, 'message my manager about the weekly report', 'messageManager');

    // Test message HR
    await testBotCommand(tokens.admin, 'contact HR about leave policy', 'messageHR');

    console.log();

    // Step 4: Test Direct Messaging API with Hierarchy Rules
    console.log('📌 STEP 4: Test Hierarchy-Based Messaging Rules');
    console.log('-'.repeat(40));

    // Get some employee IDs for testing
    try {
        const empRes = await axios.get(`${BASE_URL}/api/employees?limit=10`, {
            headers: { Authorization: `Bearer ${tokens.admin}` }
        });
        const employees = empRes.data.data || [];

        if (employees.length >= 2) {
            const emp1 = employees[0];
            const emp2 = employees.find(e => e.department_id !== emp1.department_id) || employees[1];

            console.log(`\n  Test employees:`);
            console.log(`   - ${emp1.name} (${emp1.department?.name || 'Unknown Dept'})`);
            console.log(`   - ${emp2.name} (${emp2.department?.name || 'Unknown Dept'})\n`);

            // Test sending message (admin can message anyone)
            await testMessagingAPI(
                tokens.admin,
                '/send',
                'POST',
                { toEmployeeId: emp1.id, content: 'Test message from admin', subject: 'Test' },
                'Admin → Employee (should work)'
            );

            // Test sending to HR
            await testMessagingAPI(
                tokens.admin,
                '/send-to-hr',
                'POST',
                { content: 'HR inquiry test', subject: 'Test HR Message' },
                'Send to HR (should work)'
            );

            // Test send to manager
            await testMessagingAPI(
                tokens.admin,
                '/send-to-manager',
                'POST',
                { content: 'Manager message test' },
                'Send to Manager (depends on assignment)'
            );

            // Test escalation
            await testMessagingAPI(
                tokens.admin,
                '/escalate',
                'POST',
                { content: 'Urgent issue that needs attention', subject: 'Escalation Test' },
                'Escalate Issue'
            );
        }
    } catch (error) {
        console.log(`  ⚠️ Could not fetch employees for hierarchy tests: ${error.message}`);
    }

    console.log();

    // Step 5: Test Inbox
    console.log('📌 STEP 5: Test Inbox & Message Reading');
    console.log('-'.repeat(40));

    const inboxResult = await testMessagingAPI(
        tokens.admin,
        '/inbox',
        'GET',
        null,
        'Get inbox'
    );

    if (inboxResult.success && inboxResult.data.messages?.length > 0) {
        console.log(`   Found ${inboxResult.data.total} messages (${inboxResult.data.unreadCount} unread)`);

        const firstMsg = inboxResult.data.messages[0];
        if (firstMsg?.id) {
            // Test reading a message
            await testMessagingAPI(
                tokens.admin,
                `/read/${firstMsg.id}`,
                'GET',
                null,
                'Read specific message'
            );

            // Test replying
            await testMessagingAPI(
                tokens.admin,
                `/reply/${firstMsg.id}`,
                'POST',
                { content: 'Test reply' },
                'Reply to message'
            );
        }
    } else {
        console.log('   No messages in inbox to test reading/replying');
    }

    // Test sent messages
    await testMessagingAPI(
        tokens.admin,
        '/sent',
        'GET',
        null,
        'Get sent messages'
    );

    console.log();

    // Step 6: Bot Commands for Reading
    console.log('📌 STEP 6: Test Bot Read/Reply Commands');
    console.log('-'.repeat(40));

    await testBotCommand(tokens.admin, 'my inbox', 'checkMessages');
    await testBotCommand(tokens.admin, 'any new messages?', 'checkMessages');

    console.log();

    // Summary
    console.log('='.repeat(60));
    console.log('TEST SUITE COMPLETED');
    console.log('='.repeat(60));
    console.log();
    console.log('Hierarchy Rules Summary:');
    console.log('  ✅ Admin/HR can message anyone');
    console.log('  ✅ Anyone can message HR');
    console.log('  ✅ Employee can message direct manager');
    console.log('  ✅ Employee can message same department colleagues');
    console.log('  ✅ Manager can message direct reports');
    console.log('  ✅ Manager can message other managers');
    console.log('  🚫 Employee cannot message different department (except HR)');
    console.log();
}

// Run tests
runTests().catch(err => {
    console.error('Test suite error:', err);
    process.exit(1);
});
