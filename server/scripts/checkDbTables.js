const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTables() {
    try {
        const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
        console.log('Tables found:', tables.map(t => t.table_name).sort());

        const requiredTables = [
            'User', 'Employee', 'Task', 'Attendance', 'Message', 'Meeting',
            'ApprovalRequest', 'Reminder', 'Goal', 'GoalMilestone', 'Achievement', 'EmployeePoints'
        ];

        // Normalize to lowercase for comparison as Postgres might lowercase them
        const existingTables = tables.map(t => t.table_name.toLowerCase());
        const missing = requiredTables.filter(t => !existingTables.includes(t.toLowerCase()));

        if (missing.length === 0) {
            console.log('All required tables exist.');
        } else {
            console.error('Missing tables:', missing);
        }

    } catch (error) {
        console.error('Error checking tables:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkTables();
