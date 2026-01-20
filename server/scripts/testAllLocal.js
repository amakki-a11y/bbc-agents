const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const tests = [
  // Phase 1: Voice Commands
  { phase: 1, feature: 'Voice', command: "Who's in?", description: 'Check who is present' },
  { phase: 1, feature: 'Voice', command: 'Pulse check', description: 'Quick status overview' },
  { phase: 1, feature: 'Voice', command: 'My tasks', description: 'List my tasks' },
  { phase: 1, feature: 'Voice', command: 'Urgent tasks', description: 'Show high priority' },

  // Phase 2: Briefing
  { phase: 2, feature: 'Briefing', command: 'Good morning', description: 'Daily briefing' },
  { phase: 2, feature: 'Briefing', command: 'Daily summary', description: 'Summary request' },

  // Phase 3: Goals & OKRs
  { phase: 3, feature: 'Goals', command: 'Show goals', description: 'List goals' },
  { phase: 3, feature: 'Goals', command: 'Create goal: Test Goal with target 100 tasks by next month', description: 'Create goal' },
  { phase: 3, feature: 'Goals', command: 'Goal progress', description: 'Check progress' },

  // Phase 4: Gamification
  { phase: 4, feature: 'Gamification', command: 'Leaderboard', description: 'Show rankings' },
  { phase: 4, feature: 'Gamification', command: 'My stats', description: 'Personal stats' },
  { phase: 4, feature: 'Gamification', command: 'My achievements', description: 'Show badges' },

  // Phase 5: Smart Insights & Predictions
  { phase: 5, feature: 'Insights', command: 'Burnout risk', description: 'Check burnout risks' },
  { phase: 5, feature: 'Insights', command: 'Performance trends', description: 'Week over week trends' },
  { phase: 5, feature: 'Insights', command: 'Project risks', description: 'At-risk projects' },
  { phase: 5, feature: 'Insights', command: 'Workload balance', description: 'Task distribution' },
  { phase: 5, feature: 'Insights', command: 'Predicted delays', description: 'Likely to be late' },
  { phase: 5, feature: 'Insights', command: 'Who deserves recognition?', description: 'Star performers' },
  { phase: 5, feature: 'Insights', command: 'Anything unusual?', description: 'Anomaly detection' },

  // Core Features
  { phase: 0, feature: 'Core', command: 'Help', description: 'Help menu' },
  { phase: 0, feature: 'Core', command: 'Create task: Test API Task', description: 'Create task' },
  { phase: 0, feature: 'Core', command: 'Check in', description: 'Attendance check-in' },
];

async function login() {
  try {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@bbc.com',
      password: 'admin123'
    });
    return res.data.accessToken;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return null;
  }
}

async function sendBotMessage(token, content) {
  try {
    const res = await axios.post(
      `${BASE_URL}/api/bot/message`,
      { content, messageType: 'question' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, response: res.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.message,
      status: error.response?.status
    };
  }
}

function truncate(str, len = 60) {
  if (!str) return 'N/A';
  const clean = str.replace(/\n/g, ' ').trim();
  return clean.length > len ? clean.substring(0, len) + '...' : clean;
}

function formatTable(results) {
  console.log('\n' + '═'.repeat(120));
  console.log('│ Phase │ Feature      │ Command                                    │ Status │ Response');
  console.log('═'.repeat(120));

  for (const r of results) {
    const phase = String(r.phase).padEnd(5);
    const feature = r.feature.padEnd(12);
    const command = r.command.padEnd(42);
    const status = r.success ? '✅' : '❌';
    const response = truncate(r.response, 50);
    console.log(`│ ${phase} │ ${feature} │ ${command} │ ${status}     │ ${response}`);
  }
  console.log('═'.repeat(120));
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           BBC AI Bot - Local Feature Test Suite                ║');
  console.log('║                   http://localhost:3000                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Step 1: Login
  console.log('🔐 Logging in as admin@bbc.com...');
  const token = await login();
  if (!token) {
    console.log('\n❌ Cannot proceed without authentication.');
    return;
  }
  console.log('✅ Login successful!\n');

  // Step 2: Run all tests
  console.log('🧪 Running bot feature tests...\n');
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    process.stdout.write(`  Testing: ${test.command.substring(0, 40).padEnd(40)}... `);

    const result = await sendBotMessage(token, test.command);

    let responseText = '';
    if (result.success) {
      responseText = result.response?.response || result.response?.message || JSON.stringify(result.response);
      passed++;
      console.log('✅');
    } else {
      responseText = result.error || `HTTP ${result.status}`;
      failed++;
      console.log('❌', responseText.substring(0, 50));
    }

    results.push({
      phase: test.phase,
      feature: test.feature,
      command: test.command,
      description: test.description,
      success: result.success,
      response: responseText
    });

    // Longer delay to avoid rate limiting (Anthropic API)
    await new Promise(r => setTimeout(r, 3000));
  }

  // Step 3: Show results table
  formatTable(results);

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('─'.repeat(40));
  console.log(`  Total Tests: ${results.length}`);
  console.log(`  ✅ Passed:   ${passed}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('─'.repeat(40));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Ready to push to GitHub.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the errors above.\n');
  }

  // Show phase breakdown
  console.log('\n📈 PHASE BREAKDOWN');
  console.log('─'.repeat(40));
  const phases = [...new Set(results.map(r => r.phase))].sort();
  for (const phase of phases) {
    const phaseResults = results.filter(r => r.phase === phase);
    const phasePassed = phaseResults.filter(r => r.success).length;
    const phaseLabel = phase === 0 ? 'Core' : `Phase ${phase}`;
    console.log(`  ${phaseLabel}: ${phasePassed}/${phaseResults.length} passed`);
  }
  console.log('─'.repeat(40));
}

runTests().catch(console.error);
