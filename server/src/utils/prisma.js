const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances in development due to hot reloading
const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

module.exports = prisma;
