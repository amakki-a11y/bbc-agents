const si = require('systeminformation');
const logger = require('../utils/logger');

const getSystemStats = async () => {
    try {
        const [cpu, mem, disk] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.fsSize(),
        ]);

        return {
            cpu: {
                load: cpu.currentLoad,
                user: cpu.currentLoadUser,
                system: cpu.currentLoadSystem,
            },
            memory: {
                total: mem.total,
                free: mem.free,
                used: mem.used,
                active: mem.active,
                available: mem.available,
            },
            disk: disk.map(d => ({
                fs: d.fs,
                type: d.type,
                size: d.size,
                used: d.used,
                available: d.available,
                mount: d.mount,
            })),
            uptime: process.uptime(), // Application uptime in seconds
        };
    } catch (error) {
        logger.error(`Error getting system stats: ${error.message}`);
        throw error;
    }
};

module.exports = {
    getSystemStats,
};
