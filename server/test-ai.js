// Smoke test for AI service with agent logging
require('dotenv').config();
const { generateProjectPlan, parseCommand } = require('./src/services/ai.service');
const prisma = require('./src/lib/prisma');

(async () => {
    console.log('🚀 Testing AI Service with Agent Logging...\n');

    try {
        // Test 1: generateProjectPlan
        console.log('═'.repeat(50));
        console.log('TEST 1: generateProjectPlan');
        console.log('═'.repeat(50));

        const plan = await generateProjectPlan('Build a user authentication system with login, registration, and password reset');
        console.log('\n📋 Generated Plan:');
        console.log(`   Name: ${plan.name}`);
        console.log(`   Tasks: ${plan.tasks.length}`);
        console.log(`   Total Time: ${plan.total_estimated_time} minutes`);
        console.log(`   Complexity: ${plan.complexity}`);
        console.log('\n   Tasks:');
        plan.tasks.forEach((t, i) => {
            console.log(`   ${i + 1}. ${t.title} (${t.time_estimate} min) [${t.priority}]`);
        });

        // Test 2: parseCommand
        console.log('\n' + '═'.repeat(50));
        console.log('TEST 2: parseCommand');
        console.log('═'.repeat(50));

        const command = await parseCommand('Add a task to buy milk tomorrow');
        console.log('\n📝 Parsed Command:');
        console.log(`   Action: ${command.action}`);
        console.log(`   Entity: ${command.entity}`);
        console.log(`   Data:`, command.data);

        // Check database logs
        console.log('\n' + '═'.repeat(50));
        console.log('DATABASE LOGS');
        console.log('═'.repeat(50));

        const logs = await prisma.agentAction.findMany({
            orderBy: { created_at: 'desc' },
            take: 5
        });

        console.log(`\n✅ Found ${logs.length} recent agent actions:\n`);
        logs.forEach((log, i) => {
            console.log(`${i + 1}. [${log.agent_name}] ${log.action}`);
            console.log(`   Status: ${log.status} | Confidence: ${log.confidence_score}`);
            console.log(`   Reasoning: ${log.reasoning}`);
            console.log(`   Time: ${log.created_at}`);
            console.log('');
        });

        console.log('✅ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
})();
