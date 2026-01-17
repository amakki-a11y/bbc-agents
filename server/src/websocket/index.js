const { Server } = require('socket.io');

let io;

const initialize = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Configure this appropriately for production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join a room based on user ID for targeted notifications
        socket.on('join', (userId) => {
            if (userId) {
                socket.join(`user:${userId}`);
                console.log(`User ${userId} joined room user:${userId}`);
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

const emitToUser = (userId, event, data) => {
    try {
        const ioInstance = getIO();
        ioInstance.to(`user:${userId}`).emit(event, data);
    } catch (error) {
        console.error('Failed to emit socket event:', error);
    }
};

module.exports = {
    initialize,
    getIO,
    emitToUser
};
