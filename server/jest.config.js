module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.js'],
    verbose: true,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
    // Setup file for database connection and cleanup
    setupFilesAfterEnv: ['<rootDir>/src/test-utils/setup.js'],
    // Increase timeout for database operations
    testTimeout: 30000,
    // Run tests sequentially to avoid database conflicts
    maxWorkers: 1,
};
