const { PrismaClient } = require('@prisma/client');
const { emitToUser } = require('../websocket');

const prisma = new PrismaClient();

const createNotification = async ({ userId, type, message, taskId = null, projectId = null }) => {
    try {
        const notification = await prisma.notification.create({
            data: {
                type,
                message,
                user_id: userId,
                task_id: taskId,
                project_id: projectId,
            },
        });

        // Emit real-time event
        emitToUser(userId, 'notification', notification);

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

const getUnreadNotifications = async (userId) => {
    return await prisma.notification.findMany({
        where: {
            user_id: userId,
            is_read: false,
        },
        orderBy: {
            created_at: 'desc',
        },
        include: {
            task: {
                select: { title: true }
            },
            project: {
                select: { name: true }
            }
        }
    });
};

const markAsRead = async (notificationId) => {
    return await prisma.notification.update({
        where: { id: parseInt(notificationId) },
        data: { is_read: true },
    });
};

const markAllAsRead = async (userId) => {
    return await prisma.notification.updateMany({
        where: {
            user_id: userId,
            is_read: false
        },
        data: { is_read: true }
    });
}

module.exports = {
    createNotification,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead
};
