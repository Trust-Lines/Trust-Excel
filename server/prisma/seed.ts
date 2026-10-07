import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create Admin role (full permissions including canManageMasterData)
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      isSystem: true,
      isActive: true,
      pagePermissions: {
        operationalBoardView: true,
        createProject: true,
        canAddItems: true,
        canManageMasterData: true,
      },
    },
  });
  console.log(`✅ Created role: ${adminRole.name}`);

  // Create Client role (limited permissions)
  const clientRole = await prisma.role.upsert({
    where: { name: 'CLIENT' },
    update: {},
    create: {
      name: 'CLIENT',
      isSystem: true,
      isActive: true,
      pagePermissions: {
        operationalBoardView: true,
        createProject: false,
        canAddItems: false,
        canManageMasterData: false,
      },
    },
  });
  console.log(`✅ Created role: ${clientRole.name}`);

  // Create Employee role (medium permissions)
  const employeeRole = await prisma.role.upsert({
    where: { name: 'EMPLOYEE' },
    update: {},
    create: {
      name: 'EMPLOYEE',
      isSystem: true,
      isActive: true,
      pagePermissions: {
        operationalBoardView: true,
        createProject: true,
        canAddItems: true,
        canManageMasterData: false,
      },
    },
  });
  console.log(`✅ Created role: ${employeeRole.name}`);

  // Create Finance role (can manage master data)
  const financeRole = await prisma.role.upsert({
    where: { name: 'FINANCE' },
    update: {},
    create: {
      name: 'FINANCE',
      isSystem: true,
      isActive: true,
      pagePermissions: {
        operationalBoardView: true,
        createProject: true,
        canAddItems: true,
        canManageMasterData: true,
      },
    },
  });
  console.log(`✅ Created role: ${financeRole.name}`);

  // Create PM role (can manage master data)
  const pmRole = await prisma.role.upsert({
    where: { name: 'PM' },
    update: {},
    create: {
      name: 'PM',
      isSystem: true,
      isActive: true,
      pagePermissions: {
        operationalBoardView: true,
        createProject: true,
        canAddItems: true,
        canManageMasterData: true,
      },
    },
  });
  console.log(`✅ Created role: ${pmRole.name}`);

  // Create Millwork role (can manage master data)
  const millworkRole = await prisma.role.upsert({
    where: { name: 'MILLWORK' },
    update: {},
    create: {
      name: 'MILLWORK',
      isSystem: true,
      isActive: true,
      pagePermissions: {
        operationalBoardView: true,
        createProject: true,
        canAddItems: true,
        canManageMasterData: true,
      },
    },
  });
  console.log(`✅ Created role: ${millworkRole.name}`);

  // Create Image role (can manage master data) - CRITICAL FIX
  const imageRole = await prisma.role.upsert({
    where: { name: 'IMAGE' },
    update: {},
    create: {
      name: 'IMAGE',
      isSystem: true,
      isActive: true,
      pagePermissions: {
        operationalBoardView: true,
        createProject: true,
        canAddItems: true,
        canManageMasterData: true,
      },
    },
  });
  console.log(`✅ Created role: ${imageRole.name}`);

  // Create Ceiling role (can manage master data)
  const ceilingRole = await prisma.role.upsert({
    where: { name: 'CEILING' },
    update: {},
    create: {
      name: 'CEILING',
      isSystem: true,
      isActive: true,
      pagePermissions: {
        operationalBoardView: true,
        createProject: true,
        canAddItems: true,
        canManageMasterData: true,
      },
    },
  });
  console.log(`✅ Created role: ${ceilingRole.name}`);

  // Create core permissions
  const permissions = [
    // User management
    { key: 'users.create', module: 'users', action: 'create' },
    { key: 'users.read', module: 'users', action: 'read' },
    { key: 'users.update', module: 'users', action: 'update' },
    { key: 'users.delete', module: 'users', action: 'delete' },

    // Role management
    { key: 'roles.create', module: 'roles', action: 'create' },
    { key: 'roles.read', module: 'roles', action: 'read' },
    { key: 'roles.update', module: 'roles', action: 'update' },
    { key: 'roles.delete', module: 'roles', action: 'delete' },

    // Permission management
    { key: 'permissions.manage', module: 'permissions', action: 'manage' },

    // Project management
    { key: 'projects.create', module: 'projects', action: 'create' },
    { key: 'projects.read', module: 'projects', action: 'read' },
    { key: 'projects.update', module: 'projects', action: 'update' },
    { key: 'projects.delete', module: 'projects', action: 'delete' },

    // Missing & Extra management
    { key: 'missing-extra.view', module: 'missing-extra', action: 'read' },
    { key: 'missing-extra.create-case', module: 'missing-extra', action: 'create' },
    { key: 'missing-extra.edit', module: 'missing-extra', action: 'update' },
    { key: 'missing-extra.delete', module: 'missing-extra', action: 'delete' },

    // Admin dashboard
    { key: 'admin.dashboard', module: 'admin', action: 'read' },
    { key: 'admin.settings', module: 'admin', action: 'manage' },
  ];

  const createdPermissions: { id: string; key: string; module: string; action: string; createdAt: Date }[] = [];
  for (const permission of permissions) {
    const createdPermission = await prisma.permission.upsert({
      where: { key: permission.key },
      update: {},
      create: permission,
    });
    createdPermissions.push(createdPermission);
  }
  console.log(`✅ Created ${permissions.length} permissions`);

  // Assign all permissions to admin role
  for (const permission of createdPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permission.id,
      },
    });
  }
  console.log('✅ Assigned all permissions to admin role');

  // Create default column visibility for admin (all columns visible)
  const defaultColumns = [
    // Project-level columns
    'project.name',
    'project.type',
    'project.status',
    'project.priority',
    'project.assignee',
    'project.dueDate',
    'project.progress',
    'project.notes',

    // Project item columns (operational board)
    'projectNo',
    'type',
    'pfCode',
    'vendor',
    'orderType',
    'poSignStatus',
    'pfSignStatus',
    'status',
    'std',
    'etd',
    'rtd',
    'rtr',
    'ftd',
    'pfUsd',
    'pfTl',
    'containerNo',
  ];

  // Set up column visibility for all relevant roles
  const rolesToSetup = [adminRole, financeRole, pmRole, millworkRole, imageRole, ceilingRole];

  for (const role of rolesToSetup) {
    for (const columnKey of defaultColumns) {
      // Check if already exists (can't use upsert with null tableId in compound unique)
      const existing = await prisma.roleColumnVisibility.findFirst({
        where: {
          roleId: role.id,
          tableId: null,
          columnKey: columnKey,
        },
      });

      if (!existing) {
        await prisma.roleColumnVisibility.create({
          data: {
            roleId: role.id,
            tableId: null,
            columnKey: columnKey,
            isHidden: false,
            isReadOnly: false,
          },
        });
      }
    }
    console.log(`✅ Set default column visibility for ${role.name} role`);
  }

  // ── Create PageRegistry entries and grant ADMIN access to ALL pages ──
  const navPages = [
    { key: 'dashboard', name: 'Dashboard' },
    { key: 'operational_board', name: 'Projects' },
    { key: 'missing_extra', name: 'Missing & Extra' },
    { key: 'direct_order', name: 'Direct Order' },
    { key: 'suppliers_vendors', name: 'Suppliers / Vendors' },
    { key: 'supplier_total', name: 'Supplier Total' },
    { key: 'project_total', name: 'Project Total' },
    { key: 'admin_roles_permissions', name: 'Admin > Roles & Permissions' },
    { key: 'admin_activity_log', name: 'Activity Log' },
    { key: 'trust_expenses', name: 'Trust Expenses' },
    { key: 'expenses_p', name: 'Expenses P' },
    { key: 'expenses_direct_order', name: 'Expenses Direct Order' },
    { key: 'expenses_missing_extra', name: 'Expenses Missing & Extra' },
  ];

  for (const page of navPages) {
    const pageRecord = await prisma.pageRegistry.upsert({
      where: { key: page.key },
      update: {},
      create: { key: page.key, name: page.name },
    });

    // Grant ADMIN access to every page
    const existing = await prisma.rolePageAccess.findFirst({
      where: { roleId: adminRole.id, pageId: pageRecord.id },
    });
    if (!existing) {
      await prisma.rolePageAccess.create({
        data: { roleId: adminRole.id, pageId: pageRecord.id, hasAccess: true },
      });
    }
  }
  console.log('✅ Created page registry + ADMIN page access for all pages');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('Admin123!', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@local.test' },
    update: {},
    create: {
      email: 'admin@local.test',
      name: 'Admin User',
      passwordHash: adminPasswordHash,
      roleId: adminRole.id,
      isActive: true,
    },
  });
  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create client users
  const clientPasswordHash = await bcrypt.hash('Client123!', 10);

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@local.test' },
    update: {},
    create: {
      email: 'client@local.test',
      name: 'Client User',
      passwordHash: clientPasswordHash,
      roleId: clientRole.id,
      isActive: true,
    },
  });
  console.log(`✅ Created client user: ${clientUser.email}`);

  // Additional test clients
  const clientUser2 = await prisma.user.upsert({
    where: { email: 'hamzag@trust-lines.com' },
    update: {},
    create: {
      email: 'hamzag@trust-lines.com',
      name: 'Hamza Trust Lines',
      passwordHash: clientPasswordHash,
      roleId: clientRole.id,
      isActive: true,
    },
  });
  console.log(`✅ Created client user: ${clientUser2.email}`);

  const clientUser3 = await prisma.user.upsert({
    where: { email: 'downtown@construction.com' },
    update: {},
    create: {
      email: 'downtown@construction.com',
      name: 'Downtown Construction Co.',
      passwordHash: clientPasswordHash,
      roleId: clientRole.id,
      isActive: true,
    },
  });
  console.log(`✅ Created client user: ${clientUser3.email}`);

  const clientUser4 = await prisma.user.upsert({
    where: { email: 'green@energy.com' },
    update: {},
    create: {
      email: 'green@energy.com',
      name: 'Green Energy Corp',
      passwordHash: clientPasswordHash,
      roleId: clientRole.id,
      isActive: true,
    },
  });
  console.log(`✅ Created client user: ${clientUser4.email}`);

  // Create IMAGE role test user - CRITICAL for testing vendor creation
  const imagePasswordHash = await bcrypt.hash('Image123!', 10);

  const imageUser = await prisma.user.upsert({
    where: { email: 'image@local.test' },
    update: {},
    create: {
      email: 'image@local.test',
      name: 'Image User',
      passwordHash: imagePasswordHash,
      roleId: imageRole.id,
      isActive: true,
    },
  });
  console.log(`✅ Created IMAGE user: ${imageUser.email}`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('');
  console.log('📝 Test User Credentials:');
  console.log(`   Admin - Email: ${adminUser.email}, Password: Admin123!`);
  console.log(`   Client - Email: ${clientUser.email}, Password: Client123!`);
  console.log(`   Image - Email: ${imageUser.email}, Password: Image123!`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });