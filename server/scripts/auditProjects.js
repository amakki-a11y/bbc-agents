const prisma = require('../src/lib/prisma');

async function audit() {
  console.log('=== PROJECTS AUDIT ===\n');

  // 1. List all projects
  const projects = await prisma.project.findMany({
    include: {
      user: { select: { id: true, username: true, email: true } },
      tasks: { select: { id: true, title: true, status: true } },
      _count: { select: { tasks: true, members: true } }
    }
  });

  console.log(`Total Projects: ${projects.length}\n`);
  projects.forEach(p => {
    console.log(`ID: ${p.id}`);
    console.log(`Name: ${p.name}`);
    console.log(`Description: ${p.description || 'N/A'}`);
    console.log(`Archived: ${p.archived}`);
    console.log(`Owner: ${p.user?.username || 'N/A'} (${p.user?.email || 'N/A'})`);
    console.log(`Tasks: ${p._count.tasks}, Members: ${p._count.members}`);
    if (p.tasks.length > 0) {
      console.log('Tasks:');
      p.tasks.slice(0, 5).forEach(t => console.log(`  - [${t.id}] ${t.title} [${t.status}]`));
      if (p.tasks.length > 5) console.log(`  ... and ${p.tasks.length - 5} more`);
    }
    console.log('---');
  });

  // 2. List orphaned tasks (tasks without valid project)
  console.log('\n=== ORPHANED TASKS (no project_id) ===\n');
  const orphanedTasks = await prisma.task.findMany({
    where: {
      project_id: null
    },
    select: {
      id: true,
      title: true,
      status: true,
      user: { select: { username: true, email: true } }
    }
  });
  console.log(`Orphaned tasks (no project): ${orphanedTasks.length}`);
  orphanedTasks.slice(0, 10).forEach(t => {
    console.log(`  - [${t.id}] ${t.title} (${t.status}) - Owner: ${t.user?.username || t.user?.email || 'NONE'}`);
  });
  if (orphanedTasks.length > 10) console.log(`  ... and ${orphanedTasks.length - 10} more`);

  // 3. List all tasks summary
  console.log('\n=== ALL TASKS SUMMARY ===\n');
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    _count: { id: true }
  });
  console.log('Tasks by status:');
  taskStats.forEach(s => console.log(`  - ${s.status}: ${s._count.id}`));

  const totalTasks = await prisma.task.count();
  const tasksWithProject = await prisma.task.count({ where: { project_id: { not: null } } });
  console.log(`\nTotal tasks: ${totalTasks}`);
  console.log(`Tasks with project: ${tasksWithProject}`);
  console.log(`Tasks without project: ${totalTasks - tasksWithProject}`);

  // 4. Check for "Business Requirements" specifically
  console.log('\n=== SEARCHING FOR "Business Requirements" ===\n');
  const bizReq = await prisma.project.findMany({
    where: {
      name: { contains: 'Business', mode: 'insensitive' }
    }
  });
  console.log(`Found ${bizReq.length} projects with "Business" in name:`);
  bizReq.forEach(p => console.log(`  - ID ${p.id}: "${p.name}" (archived: ${p.archived})`));

  // Also check for any project with "Requirements" in name
  const reqProjects = await prisma.project.findMany({
    where: {
      name: { contains: 'Requirements', mode: 'insensitive' }
    }
  });
  console.log(`\nFound ${reqProjects.length} projects with "Requirements" in name:`);
  reqProjects.forEach(p => console.log(`  - ID ${p.id}: "${p.name}" (archived: ${p.archived})`));

  // 5. Check project ID 6 specifically
  console.log('\n=== CHECKING PROJECT ID 6 ===\n');
  const project6 = await prisma.project.findUnique({
    where: { id: 6 },
    include: {
      user: { select: { username: true, email: true } },
      _count: { select: { tasks: true, members: true } }
    }
  });
  if (project6) {
    console.log(`Project 6 EXISTS:`);
    console.log(`  Name: ${project6.name}`);
    console.log(`  Description: ${project6.description || 'N/A'}`);
    console.log(`  Archived: ${project6.archived}`);
    console.log(`  Owner: ${project6.user?.username || 'N/A'} (${project6.user?.email})`);
    console.log(`  Tasks: ${project6._count.tasks}, Members: ${project6._count.members}`);
  } else {
    console.log(`Project ID 6 does NOT exist in database`);
  }

  // 6. List all project IDs for reference
  console.log('\n=== ALL PROJECT IDs ===\n');
  const allProjectIds = await prisma.project.findMany({
    select: { id: true, name: true, archived: true },
    orderBy: { id: 'asc' }
  });
  console.log('Existing project IDs:');
  allProjectIds.forEach(p => console.log(`  - ${p.id}: "${p.name}" ${p.archived ? '(ARCHIVED)' : ''}`));

  // 7. Check for any data issues
  console.log('\n=== DATA ISSUES CHECK ===\n');

  // Projects without owner - user_id is required so this shouldn't happen
  // but check anyway
  const allProjects = await prisma.project.findMany({ select: { id: true, user_id: true } });
  const projectsNoOwner = allProjects.filter(p => !p.user_id).length;
  console.log(`Projects without owner: ${projectsNoOwner}`);

  // Tasks without owner
  const allTasksCheck = await prisma.task.findMany({ select: { id: true, user_id: true } });
  const tasksNoOwner = allTasksCheck.filter(t => !t.user_id).length;
  console.log(`Tasks without owner: ${tasksNoOwner}`);
}

audit()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
