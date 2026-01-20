const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCheckIn() {
    // Get employee
    const employee = await prisma.employee.findFirst({
        where: { user_id: 1 }
    });

    if (!employee) {
        console.log('No employee found!');
        return;
    }

    console.log('Employee found:');
    console.log('- ID:', employee.id);
    console.log('- ID type:', typeof employee.id);
    console.log('- Name:', employee.name);
    console.log('');

    // Try to create attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();

    console.log('Creating attendance record...');
    console.log('- Employee ID:', employee.id);
    console.log('- Date:', today);
    console.log('- Check-in time:', now);
    console.log('');

    try {
        // Check existing
        const existing = await prisma.attendance.findFirst({
            where: {
                employee_id: employee.id,
                date: {
                    gte: today,
                    lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                }
            }
        });

        console.log('Existing attendance:', existing);

        if (existing) {
            console.log('Already has attendance record for today');
            // Update it
            const updated = await prisma.attendance.update({
                where: { id: existing.id },
                data: {
                    check_in: now,
                    status: 'present'
                }
            });
            console.log('Updated attendance:', updated);
        } else {
            // Create new
            const created = await prisma.attendance.create({
                data: {
                    employee_id: employee.id,
                    date: today,
                    check_in: now,
                    status: 'present'
                }
            });
            console.log('Created attendance:', created);
        }

        // Verify
        const allAttendance = await prisma.attendance.findMany({
            where: { employee_id: employee.id }
        });
        console.log('\nAll attendance records for employee:');
        console.log(allAttendance);

    } catch (error) {
        console.error('Error:', error);
    }

    await prisma.$disconnect();
}

testCheckIn();
