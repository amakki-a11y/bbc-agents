const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupTestData() {
  console.log('Setting up test data for local testing...\n');

  try {
    // Check if admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@bbc.com' }
    });

    if (!adminUser) {
      console.log('❌ Admin user not found. Run createAdmin.js first.');
      return;
    }
    console.log('✅ Admin user found:', adminUser.id, adminUser.email);

    // Check/create department
    let department = await prisma.department.findUnique({
      where: { name: 'Management' }
    });
    if (!department) {
      department = await prisma.department.create({
        data: { name: 'Management', description: 'Executive Management' }
      });
      console.log('✅ Created department:', department.name);
    } else {
      console.log('✅ Department exists:', department.name);
    }

    // Check/create role
    let role = await prisma.role.findUnique({
      where: { name: 'Admin' }
    });
    if (!role) {
      role = await prisma.role.create({
        data: {
          name: 'Admin',
          permissions: JSON.stringify([
            'manage_employees', 'manage_departments', 'manage_roles',
            'view_all_attendance', 'approve_leave', 'view_reports',
            'manage_goals', 'view_leaderboard'
          ])
        }
      });
      console.log('✅ Created role:', role.name);
    } else {
      console.log('✅ Role exists:', role.name);
    }

    // Check/create employee for admin user
    let employee = await prisma.employee.findUnique({
      where: { user_id: adminUser.id }
    });
    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          user_id: adminUser.id,
          name: 'Admin User',
          email: 'admin@bbc.com',
          department_id: department.id,
          role_id: role.id,
          hire_date: new Date(),
          status: 'active'
        }
      });
      console.log('✅ Created employee record for admin:', employee.id);
    } else {
      console.log('✅ Employee exists:', employee.id, employee.name);
    }

    // Create some test tasks for the admin
    const existingTasks = await prisma.task.count({
      where: { user_id: adminUser.id }
    });
    if (existingTasks === 0) {
      await prisma.task.createMany({
        data: [
          { title: 'Review Q1 Reports', status: 'todo', priority: 'high', user_id: adminUser.id },
          { title: 'Team Meeting Prep', status: 'in_progress', priority: 'medium', user_id: adminUser.id },
          { title: 'Update Documentation', status: 'todo', priority: 'low', user_id: adminUser.id },
        ]
      });
      console.log('✅ Created 3 test tasks');
    } else {
      console.log('✅ Tasks exist:', existingTasks, 'tasks');
    }

    // Check/create leave types
    const leaveTypes = await prisma.leaveType.count();
    if (leaveTypes === 0) {
      await prisma.leaveType.createMany({
        data: [
          { name: 'Annual Leave', days_allowed: 21, color: '#3b82f6' },
          { name: 'Sick Leave', days_allowed: 10, color: '#ef4444' },
          { name: 'Personal Leave', days_allowed: 5, color: '#8b5cf6' },
        ]
      });
      console.log('✅ Created leave types');
    } else {
      console.log('✅ Leave types exist:', leaveTypes);
    }

    console.log('\n✅ Test data setup complete!');
    console.log('You can now test all bot features.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
