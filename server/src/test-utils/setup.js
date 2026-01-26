/**
 * Jest Test Setup
 *
 * This setup file configures the test environment for integration tests.
 * Tests run against the actual PostgreSQL database, so test data is isolated
 * using unique identifiers and cleaned up after each test.
 */

const { PrismaClient } = require('@prisma/client');

// Create a dedicated test Prisma client
const prisma = new PrismaClient({
    log: ['error'], // Only log errors during tests
});

// Test data prefix to identify test records
const TEST_PREFIX = 'test_';

beforeAll(async () => {
    // Connect to the database
    try {
        await prisma.$connect();
        console.log('Test database connected');
    } catch (error) {
        console.error('Failed to connect to test database:', error.message);
        throw error;
    }
});

afterAll(async () => {
    // Clean up all test data at the end of all tests
    await cleanupTestData();
    // Disconnect from the database
    await prisma.$disconnect();
    console.log('Test database disconnected');
});

// Helper function to clean up test data
const cleanupTestData = async () => {
    try {
        // Find test user IDs
        const testUsers = await prisma.user.findMany({
            where: {
                email: { contains: TEST_PREFIX }
            },
            select: { id: true }
        });

        const testUserIds = testUsers.map(u => u.id);

        if (testUserIds.length > 0) {
            // Delete in proper order to respect foreign keys
            await prisma.$transaction([
                // Delete task-related data
                prisma.subtask.deleteMany({ where: { task: { user_id: { in: testUserIds } } } }),
                prisma.actionItem.deleteMany({ where: { task: { user_id: { in: testUserIds } } } }),
                prisma.activity.deleteMany({ where: { task: { user_id: { in: testUserIds } } } }),
                prisma.timeEntry.deleteMany({ where: { task: { user_id: { in: testUserIds } } } }),
                prisma.customField.deleteMany({ where: { task: { user_id: { in: testUserIds } } } }),
                prisma.attachment.deleteMany({ where: { task: { user_id: { in: testUserIds } } } }),
                prisma.notification.deleteMany({ where: { user_id: { in: testUserIds } } }),
                prisma.taskTemplate.deleteMany({ where: { user_id: { in: testUserIds } } }),
                prisma.task.deleteMany({ where: { user_id: { in: testUserIds } } }),
                prisma.event.deleteMany({ where: { user_id: { in: testUserIds } } }),
                prisma.projectMember.deleteMany({ where: { user_id: { in: testUserIds } } }),
                prisma.project.deleteMany({ where: { user_id: { in: testUserIds } } }),
                prisma.activityLog.deleteMany({ where: { user_id: { in: testUserIds } } }),
                prisma.user.deleteMany({ where: { id: { in: testUserIds } } }),
            ]);
            console.log(`Cleaned up ${testUserIds.length} test users and their data`);
        }
    } catch (error) {
        // Log but don't fail - cleanup errors shouldn't break test suite
        console.warn('Test cleanup warning:', error.message);
    }
};

// Export helpers for tests
module.exports = {
    prisma,
    TEST_PREFIX,

    // Helper to generate test email
    generateTestEmail: () => `${TEST_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,

    // Helper to create a test user
    createTestUser: async (overrides = {}) => {
        const bcrypt = require('bcrypt');
        const email = overrides.email || `${TEST_PREFIX}${Date.now()}@test.com`;
        const password = overrides.password || 'TestPass123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        return prisma.user.create({
            data: {
                email,
                password_hash: hashedPassword,
                ...overrides,
            },
        });
    },
};
