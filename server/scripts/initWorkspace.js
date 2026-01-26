/**
 * Initialize Default Workspace
 *
 * This script creates the default workspace hierarchy for BBC Agents:
 * - Creates a "BBC Agents" workspace
 * - Creates spaces for each department
 * - Creates default folders and lists in each space
 *
 * Run with: node scripts/initWorkspace.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function initWorkspace() {
    console.log('Starting workspace initialization...\n');

    try {
        // Check if workspace already exists
        const existingWorkspace = await prisma.workspace.findFirst({
            where: { name: 'BBC Agents' }
        });

        if (existingWorkspace) {
            console.log('Default workspace already exists. Skipping initialization.');
            console.log(`Workspace ID: ${existingWorkspace.id}`);
            return existingWorkspace;
        }

        // Find the first admin employee to be the owner
        const adminEmployee = await prisma.employee.findFirst({
            where: {
                role: {
                    name: { in: ['Admin', 'Administrator', 'System Admin'] }
                }
            },
            include: { role: true }
        });

        if (!adminEmployee) {
            // Find any employee as fallback
            const anyEmployee = await prisma.employee.findFirst();
            if (!anyEmployee) {
                console.error('No employees found. Please create at least one employee first.');
                return null;
            }
            console.log(`Using employee "${anyEmployee.name}" as workspace owner (no admin found)`);
            var ownerId = anyEmployee.id;
        } else {
            console.log(`Using admin "${adminEmployee.name}" as workspace owner`);
            var ownerId = adminEmployee.id;
        }

        // Get all departments
        const departments = await prisma.department.findMany();
        console.log(`Found ${departments.length} departments\n`);

        // Create the main workspace
        console.log('Creating workspace...');
        const workspace = await prisma.workspace.create({
            data: {
                name: 'BBC Agents',
                description: 'Main workspace for BBC Agents task management',
                icon: '🏢',
                color: '#6366F1',
                ownerId: ownerId,
                members: {
                    create: {
                        employeeId: ownerId,
                        role: 'OWNER'
                    }
                }
            }
        });
        console.log(`✓ Created workspace: ${workspace.name} (ID: ${workspace.id})\n`);

        // Create spaces for each department
        console.log('Creating spaces for departments...');
        const spaceIcons = ['📊', '💼', '🎨', '💻', '📈', '🛠️', '📋', '🎯'];

        for (let i = 0; i < departments.length; i++) {
            const dept = departments[i];
            const icon = spaceIcons[i % spaceIcons.length];

            const space = await prisma.space.create({
                data: {
                    workspaceId: workspace.id,
                    name: dept.name,
                    description: dept.description || `${dept.name} department workspace`,
                    icon: icon,
                    color: getColorForIndex(i),
                    departmentId: dept.id,
                    isPrivate: false
                }
            });
            console.log(`  ✓ Created space: ${space.name}`);

            // Create default folders for each space
            const defaultFolders = [
                { name: 'Projects', icon: '📁' },
                { name: 'Tasks', icon: '✅' },
                { name: 'Documentation', icon: '📄' }
            ];

            for (let j = 0; j < defaultFolders.length; j++) {
                const folderData = defaultFolders[j];
                const folder = await prisma.folder.create({
                    data: {
                        spaceId: space.id,
                        name: folderData.name,
                        icon: folderData.icon,
                        sortOrder: j
                    }
                });

                // Create a default list in each folder
                const list = await prisma.list.create({
                    data: {
                        spaceId: space.id,
                        folderId: folder.id,
                        name: `${dept.name} ${folderData.name}`,
                        description: `Default ${folderData.name.toLowerCase()} list for ${dept.name}`,
                        icon: '📋',
                        color: getColorForIndex(i),
                        sortOrder: 0,
                        statuses: {
                            create: [
                                { name: 'To Do', color: '#6B7280', sortOrder: 0, isDefault: true },
                                { name: 'In Progress', color: '#3B82F6', sortOrder: 1 },
                                { name: 'Review', color: '#F59E0B', sortOrder: 2 },
                                { name: 'Done', color: '#10B981', sortOrder: 3, isClosed: true }
                            ]
                        }
                    }
                });
            }

            // Create one list directly in the space (not in a folder)
            await prisma.list.create({
                data: {
                    spaceId: space.id,
                    folderId: null,
                    name: 'Quick Tasks',
                    description: 'Quick tasks and to-dos',
                    icon: '⚡',
                    color: '#EF4444',
                    sortOrder: 0,
                    statuses: {
                        create: [
                            { name: 'To Do', color: '#6B7280', sortOrder: 0, isDefault: true },
                            { name: 'In Progress', color: '#3B82F6', sortOrder: 1 },
                            { name: 'Done', color: '#10B981', sortOrder: 2, isClosed: true }
                        ]
                    }
                }
            });
        }

        // Add all employees as workspace members
        console.log('\nAdding employees as workspace members...');
        const employees = await prisma.employee.findMany({
            where: {
                id: { not: ownerId }
            }
        });

        for (const emp of employees) {
            await prisma.workspaceMember.create({
                data: {
                    workspaceId: workspace.id,
                    employeeId: emp.id,
                    role: 'MEMBER'
                }
            });
        }
        console.log(`  ✓ Added ${employees.length} members to workspace`);

        // Create a "General" space for company-wide tasks
        console.log('\nCreating General space...');
        const generalSpace = await prisma.space.create({
            data: {
                workspaceId: workspace.id,
                name: 'General',
                description: 'Company-wide tasks and projects',
                icon: '🌐',
                color: '#8B5CF6',
                isPrivate: false
            }
        });

        // Create default lists in General space
        const generalLists = [
            { name: 'Company Projects', description: 'Cross-department projects', icon: '🚀' },
            { name: 'Announcements', description: 'Company announcements and updates', icon: '📢' },
            { name: 'Ideas', description: 'Ideas and suggestions', icon: '💡' }
        ];

        for (let i = 0; i < generalLists.length; i++) {
            const listData = generalLists[i];
            await prisma.list.create({
                data: {
                    spaceId: generalSpace.id,
                    folderId: null,
                    name: listData.name,
                    description: listData.description,
                    icon: listData.icon,
                    color: '#8B5CF6',
                    sortOrder: i,
                    statuses: {
                        create: [
                            { name: 'Open', color: '#6B7280', sortOrder: 0, isDefault: true },
                            { name: 'In Progress', color: '#3B82F6', sortOrder: 1 },
                            { name: 'Completed', color: '#10B981', sortOrder: 2, isClosed: true }
                        ]
                    }
                }
            });
        }
        console.log(`  ✓ Created General space with ${generalLists.length} lists`);

        console.log('\n✅ Workspace initialization complete!');
        console.log(`\nWorkspace Summary:`);
        console.log(`  - Workspace ID: ${workspace.id}`);
        console.log(`  - Spaces created: ${departments.length + 1}`);
        console.log(`  - Members added: ${employees.length + 1}`);

        return workspace;
    } catch (error) {
        console.error('Error initializing workspace:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

function getColorForIndex(index) {
    const colors = [
        '#6366F1', // Indigo
        '#8B5CF6', // Violet
        '#EC4899', // Pink
        '#EF4444', // Red
        '#F59E0B', // Amber
        '#10B981', // Emerald
        '#06B6D4', // Cyan
        '#3B82F6'  // Blue
    ];
    return colors[index % colors.length];
}

// Run the script
initWorkspace()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
