const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { prisma, TEST_PREFIX } = require('./setup');

const createTestUser = async (overrides = {}) => {
    const passwordHash = await bcrypt.hash('password123', 10);
    // Use TEST_PREFIX to ensure cleanup works
    const email = overrides.email || `${TEST_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;
    const user = await prisma.user.create({
        data: {
            email,
            password_hash: passwordHash,
            ...overrides,
        },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'dev_secret_key_123');

    return { user, token };
};

const createTestProject = async (userId, overrides = {}) => {
    return await prisma.project.create({
        data: {
            name: `${TEST_PREFIX}Project ${Date.now()}`,
            user_id: userId,
            ...overrides,
        },
    });
};

module.exports = {
    createTestUser,
    createTestProject,
    prisma,
    TEST_PREFIX,
};
