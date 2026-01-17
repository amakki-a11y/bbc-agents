const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const prisma = require('./setup');

const createTestUser = async (overrides = {}) => {
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
        data: {
            email: overrides.email || `test-${Date.now()}@example.com`,
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
            name: 'Test Project',
            user_id: userId,
            ...overrides,
        },
    });
};

module.exports = {
    createTestUser,
    createTestProject,
};
