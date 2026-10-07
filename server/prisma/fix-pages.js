const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  // Find all roles
  const allRoles = await prisma.role.findMany();
  console.log('Roles:', allRoles.map(r => `${r.name} (${r.isSystem ? 'system' : 'custom'})`).join(', '));

  // Get total pages
  const totalPages = await prisma.pageRegistry.findMany({
    where: { key: { in: ['supplier_total', 'project_total'] } }
  });
  console.log('Total pages found:', totalPages.map(p => p.key).join(', '));

  // Add page access for ALL roles that don't have it
  for (const role of allRoles) {
    for (const page of totalPages) {
      const existing = await prisma.rolePageAccess.findUnique({
        where: { roleId_pageId: { roleId: role.id, pageId: page.id } }
      });
      if (!existing) {
        // System roles and ADMIN get access by default
        const hasAccess = role.isSystem || role.name === 'ADMIN';
        await prisma.rolePageAccess.create({
          data: { roleId: role.id, pageId: page.id, hasAccess }
        });
        console.log(`  Created: ${role.name} -> ${page.key} = ${hasAccess}`);
      } else {
        console.log(`  Exists: ${role.name} -> ${page.key} = ${existing.hasAccess}`);
      }
    }
  }

  // Ensure ADMIN (system) has ALL pages set to true
  const adminRole = allRoles.find(r => r.isSystem);
  if (adminRole) {
    const allPages = await prisma.pageRegistry.findMany();
    for (const page of allPages) {
      await prisma.rolePageAccess.upsert({
        where: { roleId_pageId: { roleId: adminRole.id, pageId: page.id } },
        create: { roleId: adminRole.id, pageId: page.id, hasAccess: true },
        update: { hasAccess: true },
      });
    }
    console.log(`\nAll ${allPages.length} pages set to true for system ADMIN role`);
  }

  await prisma.$disconnect();
  console.log('\nDone!');
}

fix().catch(console.error);
