const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const departments = [
  { name: 'Customer Support', description: 'Handles customer inquiries, complaints, and support tickets' },
  { name: 'Accounting', description: 'Manages financial records, budgets, and financial reporting' },
  { name: 'Dealing', description: 'Manages trading operations and client transactions' },
  { name: 'HR', description: 'Human Resources - handles recruitment, employee relations, and benefits' },
  { name: 'Management', description: 'Executive management and strategic planning' },
  { name: 'Marketing', description: 'Brand management, advertising, and market research' },
  { name: 'Sales', description: 'Client acquisition, sales operations, and revenue generation' },
  { name: 'Risk Management', description: 'Risk assessment, compliance, and regulatory affairs' },
];

const roles = [
  {
    name: 'Admin',
    permissions: JSON.stringify([
      'manage_departments',
      'manage_employees',
      'manage_roles',
      'view_all_tasks',
      'view_department_tasks',
      'manage_attendance',
      'manage_leave',
      'view_reports',
      'send_announcements'
    ]),
  },
  {
    name: 'Head of Department',
    permissions: JSON.stringify([
      'manage_employees',
      'view_department_tasks',
      'manage_attendance',
      'manage_leave',
      'view_reports'
    ]),
  },
  {
    name: 'Assistant',
    permissions: JSON.stringify([
      'view_department_tasks',
      'view_reports'
    ]),
  },
  {
    name: 'Employee',
    permissions: JSON.stringify([]),
  },
];

const leaveTypes = [
  { name: 'Annual Leave', days_allowed: 20, color: '#3b82f6' },
  { name: 'Sick Leave', days_allowed: 10, color: '#ef4444' },
  { name: 'Personal Leave', days_allowed: 5, color: '#8b5cf6' },
  { name: 'Maternity Leave', days_allowed: 90, color: '#ec4899' },
  { name: 'Paternity Leave', days_allowed: 10, color: '#06b6d4' },
  { name: 'Unpaid Leave', days_allowed: 0, color: '#6b7280' },
];

async function main() {
  console.log('Seeding database...');

  // Seed Departments
  console.log('Creating departments...');
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
  console.log(`Created ${departments.length} departments`);

  // Seed Roles
  console.log('Creating roles...');
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { permissions: role.permissions },
      create: role,
    });
  }
  console.log(`Created ${roles.length} roles`);

  // Seed Leave Types
  console.log('Creating leave types...');
  for (const type of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { name: type.name },
      update: { days_allowed: type.days_allowed, color: type.color },
      create: type,
    });
  }
  console.log(`Created ${leaveTypes.length} leave types`);

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
