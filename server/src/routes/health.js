const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

const monitoringService = require('../services/monitoring');
const logger = require('../utils/logger');

// Basic Health Check
router.get('/', async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
    };

    try {
        await prisma.$queryRaw`SELECT 1`;
        res.send(healthcheck);
    } catch (error) {
        healthcheck.message = error;
        res.status(503).send(healthcheck);
    }
});

// Detailed Health Check
router.get('/detailed', async (req, res) => {
    try {
        const stats = await monitoringService.getSystemStats();
        res.json({
            status: 'OK',
            timestamp: new Date(),
            system: stats,
        });
    } catch (error) {
        logger.error('Detailed health check failed', error);
        res.status(500).json({ status: 'ERROR', error: error.message });
    }
});

module.exports = router;
