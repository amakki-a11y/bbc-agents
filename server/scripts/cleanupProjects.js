const prisma = require('../src/lib/prisma');

async function cleanup() {
  console.log('=== PROJECT CLEANUP ===\n');

  // 1. Get current state
  const allProjects = await prisma.project.findMany({
    select: { id: true, name: true, archived: true, _count: { select: { tasks: true } } },
    orderBy: { id: 'asc' }
  });

  console.log(`Total projects before cleanup: ${allProjects.length}\n`);

  // 2. Find projects to delete:
  // - Archived "Test Add Project" duplicates
  // - Archived "Build Sales Team" duplicates (keep ID 6 which is not archived)
  // - Test projects like "test", "test 2", "test5"

  const projectsToDelete = allProjects.filter(p => {
    // Keep non-archived projects
    if (!p.archived) return false;

    // Keep projects with tasks
    if (p._count.tasks > 0) return false;

    // Delete archived test projects
    const testNames = ['Test Add Project', 'test', 'test 2', 'test5'];
    if (testNames.includes(p.name)) return true;

    // Delete archived "Build Sales Team" duplicates (there are 3 archived ones)
    if (p.name === 'Build Sales Team' && p.archived) return true;

    return false;
  });

  console.log(`Projects to delete: ${projectsToDelete.length}`);
  projectsToDelete.forEach(p => console.log(`  - ID ${p.id}: "${p.name}" (tasks: ${p._count.tasks})`));

  if (projectsToDelete.length === 0) {
    console.log('\nNo projects to delete. Database is clean.');
    return;
  }

  // 3. Delete the projects
  console.log('\nDeleting projects...');

  for (const p of projectsToDelete) {
    try {
      await prisma.project.delete({ where: { id: p.id } });
      console.log(`  Deleted: ID ${p.id} "${p.name}"`);
    } catch (e) {
      console.error(`  Failed to delete ID ${p.id}: ${e.message}`);
    }
  }

  // 4. Show final state
  const remainingProjects = await prisma.project.findMany({
    select: { id: true, name: true, archived: true },
    orderBy: { id: 'asc' }
  });

  console.log(`\n=== REMAINING PROJECTS: ${remainingProjects.length} ===`);
  remainingProjects.forEach(p => console.log(`  - ID ${p.id}: "${p.name}" ${p.archived ? '(ARCHIVED)' : ''}`));
}

cleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
