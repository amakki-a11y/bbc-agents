const prisma = require('../lib/prisma');

/**
 * Log an activity to the system activity log
 * @param {Object} params - Activity parameters
 * @param {number} [params.userId] - User ID who performed the action
 * @param {string} [params.employeeId] - Employee ID related to the action
 * @param {string} params.action - Action type (login, logout, create, update, delete, upload, download, view)
 * @param {string} params.entityType - Entity type (task, employee, document, attendance, leave, etc.)
 * @param {string|number} [params.entityId] - ID of the affected entity
 * @param {string} params.description - Human-readable description of the action
 * @param {Object} [params.metadata] - Additional context data
 * @param {Object} [params.req] - Express request object for IP and user agent
 */
const logActivity = async ({
    userId,
    employeeId,
    action,
    entityType,
    entityId,
    description,
    metadata,
    req
}) => {
    try {
        await prisma.activityLog.create({
            data: {
                user_id: userId || null,
                employee_id: employeeId || null,
                action,
                entity_type: entityType,
                entity_id: entityId ? String(entityId) : null,
                description,
                metadata: metadata || null,
                ip_address: req?.ip || req?.connection?.remoteAddress || req?.headers?.['x-forwarded-for'] || null,
                user_agent: req?.headers?.['user-agent'] || null
            }
        });
    } catch (error) {
        // Don't let logging failures affect the main operation
        console.error('Failed to log activity:', error.message);
    }
};

// Convenience methods for common actions (must return the promise!)

const logLogin = (userId, req, metadata = {}) => {
    return logActivity({
        userId,
        action: 'login',
        entityType: 'auth',
        description: 'User logged in',
        metadata,
        req
    });
};

const logLogout = (userId, req) => {
    return logActivity({
        userId,
        action: 'logout',
        entityType: 'auth',
        description: 'User logged out',
        req
    });
};

const logRegister = (userId, email, req) => {
    return logActivity({
        userId,
        action: 'register',
        entityType: 'auth',
        description: `New user registered: ${email}`,
        metadata: { email },
        req
    });
};

const logCreate = (userId, entityType, entityId, description, req, metadata = {}) => {
    return logActivity({
        userId,
        action: 'create',
        entityType,
        entityId,
        description,
        metadata,
        req
    });
};

const logUpdate = (userId, entityType, entityId, description, req, metadata = {}) => {
    return logActivity({
        userId,
        action: 'update',
        entityType,
        entityId,
        description,
        metadata,
        req
    });
};

const logDelete = (userId, entityType, entityId, description, req, metadata = {}) => {
    return logActivity({
        userId,
        action: 'delete',
        entityType,
        entityId,
        description,
        metadata,
        req
    });
};

const logUpload = (userId, entityType, entityId, description, req, metadata = {}) => {
    return logActivity({
        userId,
        action: 'upload',
        entityType,
        entityId,
        description,
        metadata,
        req
    });
};

const logDownload = (userId, entityType, entityId, description, req, metadata = {}) => {
    return logActivity({
        userId,
        action: 'download',
        entityType,
        entityId,
        description,
        metadata,
        req
    });
};

const logView = (userId, entityType, entityId, description, req, metadata = {}) => {
    return logActivity({
        userId,
        action: 'view',
        entityType,
        entityId,
        description,
        metadata,
        req
    });
};

module.exports = {
    logActivity,
    logLogin,
    logLogout,
    logRegister,
    logCreate,
    logUpdate,
    logDelete,
    logUpload,
    logDownload,
    logView
};
