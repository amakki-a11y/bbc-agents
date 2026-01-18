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
    permissions: JSON.stringify({
      departments: ['create', 'read', 'update', 'delete'],
      employees: ['create', 'read', 'update', 'delete'],
      attendance: ['create', 'read', 'update', 'delete', 'approve'],
      roles: ['create', 'read', 'update', 'delete'],
      reports: ['view', 'export'],
      settings: ['manage'],
    }),
  },
  {
    name: 'Head of Department',
    permissions: JSON.stringify({
      departments: ['read'],
      employees: ['read', 'update'],
      attendance: ['read', 'update', 'approve'],
      roles: ['read'],
      reports: ['view', 'export'],
      settings: [],
    }),
  },
  {
    name: 'Assistant',
    permissions: JSON.stringify({
      departments: ['read'],
      employees: ['read'],
      attendance: ['read', 'create'],
      roles: ['read'],
      reports: ['view'],
      settings: [],
    }),
  },
  {
    name: 'Employee',
    permissions: JSON.stringify({
      departments: ['read'],
      employees: ['read'],
      attendance: ['read', 'create'],
      roles: [],
      reports: [],
      settings: [],
    }),
  },
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
