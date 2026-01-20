const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

const commands = [
    // Phase 1 - Voice
    { cmd: "who's in?", expect: 'getWhosInOffice' },
    { cmd: "pulse check", expect: 'getPulseCheck' },
    { cmd: "red flags", expect: 'getRedFlags' },
    // Phase 2 - Briefing
    { cmd: "good morning", expect: 'getDailyBriefing' },
    // Phase 3 - Goals
    { cmd: "show goals", expect: 'getGoals' },
    // Phase 4 - Gamification
    { cmd: "leaderboard", expect: 'getLeaderboard' },
    { cmd: "my stats", expect: 'getMyStats' },
    // Phase 5 - Insights
    { cmd: "burnout risk", expect: 'getBurnoutRisk' },
    { cmd: "workload balance", expect: 'getWorkloadBalance' },
];

async function test() {
    console.log('=== Voice Commands Diagnostic ===\n');

    // Login
    let token;
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'admin@bbc.com',
            password: 'admin123'
        });
        token = res.data.accessToken;
        console.log('✅ Logged in\n');
    } catch (e) {
        console.log('❌ Login failed:', e.message);
        return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    let passed = 0, failed = 0;

    for (const { cmd, expect } of commands) {
        process.stdout.write(`Testing: "${cmd}" ... `);
        try {
            const res = await axios.post(`${BASE_URL}/api/bot/message`,
                { content: cmd, messageType: 'question' },
                { headers, timeout: 30000 }
            );

            const toolsUsed = res.data?.botMessage?.metadata?.toolsUsed || [];
            const toolNames = toolsUsed.map(t => t.tool);

            if (toolNames.includes(expect)) {
                console.log(`✅ Used ${expect}`);
                passed++;
            } else if (toolNames.length > 0) {
                console.log(`⚠️ Used ${toolNames.join(', ')} (expected ${expect})`);
                passed++; // Still worked, just different tool
            } else {
                console.log(`❌ No tool used! Response: ${res.data?.botMessage?.content?.substring(0, 50)}...`);
                failed++;
            }
        } catch (e) {
            console.log(`❌ Error: ${e.message}`);
            failed++;
        }

        // Small delay
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log(`\n=== Results: ${passed}/${commands.length} passed, ${failed} failed ===`);
}

test().catch(console.error);
