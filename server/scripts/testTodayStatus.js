const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTodayStatus() {
    const userId = 1; // The user we linked

    console.log('Testing getMyTodayStatus for user ID:', userId);
    console.log('');

    // Find employee by user_id
    const employee = await prisma.employee.findUnique({
        where: { user_id: userId }
    });

    if (!employee) {
        console.log('No employee found for user_id:', userId);
        return;
    }

    console.log('Found employee:', employee.id, '-', employee.name);
    console.log('');

    // Get today's date - matching the controller logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    console.log('Date range for query:');
    console.log('- Today (start):', today.toISOString());
    console.log('- Tomorrow (end):', tomorrow.toISOString());
    console.log('');

    // Find attendance using same logic as controller
    const attendance = await prisma.attendance.findFirst({
        where: {
            employee_id: employee.id,
            date: {
                gte: today,
                lt: tomorrow
            }
        }
    });

    console.log('Attendance record found:');
    console.log(JSON.stringify(attendance, null, 2));
    console.log('');

    // Check what the API would return
    const response = {
        hasCheckedIn: !!attendance?.check_in,
        hasCheckedOut: !!attendance?.check_out,
        checkInTime: attendance?.check_in,
        checkOutTime: attendance?.check_out,
        status: attendance?.status,
        attendance
    };

    console.log('API Response would be:');
    console.log(JSON.stringify(response, null, 2));

    // Also check ALL attendance records for this employee
    console.log('\n--- All attendance records for this employee ---');
    const allRecords = await prisma.attendance.findMany({
        where: { employee_id: employee.id },
        orderBy: { date: 'desc' }
    });
    console.log(allRecords);

    await prisma.$disconnect();
}

testTodayStatus();
