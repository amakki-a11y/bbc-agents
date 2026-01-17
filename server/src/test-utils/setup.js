const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

beforeAll(async () => {
    // Connect to the database
    await prisma.$connect();
});

afterAll(async () => {
    // Disconnect from the database
    await prisma.$disconnect();
});

afterEach(async () => {
    // Clean up database after each test
    const deleteSubtasks = prisma.subtask.deleteMany();
    const deleteActionItems = prisma.actionItem.deleteMany();
    const deleteActivities = prisma.activity.deleteMany();
    const deleteTimeEntries = prisma.timeEntry.deleteMany();
    const deleteCustomFields = prisma.customField.deleteMany();
    const deleteAttachments = prisma.attachment.deleteMany();
    const deleteEvents = prisma.event.deleteMany();
    const deleteNotifications = prisma.notification.deleteMany();
    const deleteTaskTemplates = prisma.taskTemplate.deleteMany();
    const deleteTasks = prisma.task.deleteMany();
    const deleteProjects = prisma.project.deleteMany();
    const deleteUsers = prisma.user.deleteMany(); // Users last due to foreign keys

    await prisma.$transaction([
        deleteSubtasks,
        deleteActionItems,
        deleteActivities,
        deleteTimeEntries,
        deleteCustomFields,
        deleteCustomFields,
        deleteAttachments,
        deleteEvents,
        deleteNotifications,
        deleteTaskTemplates,
        deleteTasks,
        deleteProjects,
        deleteUsers,
    ]);
});

module.exports = prisma;
