const { PrismaClient } = require('@prisma/client');
const { createNotification } = require('./src/services/notificationService');
const http = require('http');
const app = require('./src/app');
const { initialize } = require('./src/websocket');

// Setup environment
const prisma = new PrismaClient();

async function main() {
    // 1. Ensure a user exists
    let user = await prisma.user.findFirst();
    if (!user) {
        console.log("No user found, creating one...");
        user = await prisma.user.create({
            data: {
                email: "test@example.com",
                password_hash: "hashedpw",
                firstName: "Test",
                lastName: "User"
            }
        });
    }
    console.log(`Using user ID: ${user.id}`);

    // 2. Start server to have socket.io ready (mocking)
    const server = http.createServer(app);
    const io = initialize(server);
    server.listen(3001, () => {
        console.log('Test server running on 3001');

        // 3. Create a notification
        setTimeout(async () => {
            console.log("Creating test notification...");
            try {
                const notif = await createNotification({
                    userId: user.id,
                    type: "assigned_task",
                    message: "You have been assigned a new task: optimize notifications!",
                    projectId: null
                });
                console.log("Notification created:", notif);

                // Allow some time for emission
                setTimeout(() => {
                    console.log("Test complete. Check frontend if connected or database.");
                    process.exit(0);
                }, 2000);
            } catch (e) {
                console.error("Error creating notification:", e);
                process.exit(1);
            }
        }, 1000);
    });
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
