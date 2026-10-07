import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedProjectsPermissions() {
  console.log('🌱 Seeding Projects-Only Access Control Registry...');

  try {
    // 1. SEED PAGE REGISTRY - PROJECTS ONLY
    console.log('📄 Seeding Page Registry (Projects Only)...');
    const pages = [
      {
        key: 'project-tracking.projects',
        name: 'Operational Board',
        description: 'Main project management interface for operational board projects',
      }
    ];

    const pageMap = new Map<string, string>();

    for (const page of pages) {
      const createdPage = await prisma.pageRegistry.upsert({
        where: { key: page.key },
        update: page,
        create: page,
      });
      pageMap.set(page.key, createdPage.id);
      console.log(`  ✓ Page: ${page.key}`);
    }

    // 2. SEED TABLE REGISTRY - PROJECTS ONLY
    console.log('📋 Seeding Table Registry (Projects Only)...');
    const tables = [
      {
        key: 'operational-board-grid',
        name: 'Operational Board Grid',
        description: 'Main data grid for project management',
        pageKey: 'project-tracking.projects',
      }
    ];

    const tableMap = new Map<string, string>();

    for (const tableData of tables) {
      const { pageKey, ...table } = tableData;
      const pageId = pageKey ? pageMap.get(pageKey) : null;

      const createdTable = await prisma.tableRegistry.upsert({
        where: { key: table.key },
        update: table,
        create: { ...table, pageId },
      });

      tableMap.set(table.key, createdTable.id);
      console.log(`  ✓ Table: ${table.key}`);
    }

    // 3. SEED COLUMN REGISTRY - PROJECTS COLUMNS ONLY
    console.log('📊 Seeding Column Registry (Projects Columns Only)...');
    const columns = [
      // PROJECTS COLUMNS ONLY (from OPERATIONAL_BOARD_COLUMNS)
      {
        key: 'projectNo',
        name: 'Project No',
        description: 'Project identifier number',
        dataType: 'string',
        group: 'project',
        isGlobal: true,
        isMoney: false,
        width: 110,
        isEditableByDefault: false,
      },
      {
        key: 'type',
        name: 'Type',
        description: 'Project item type (MILLWORK, SHELVING, CEILING, etc.)',
        dataType: 'enum',
        group: 'project',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'pfCode',
        name: 'PF Code',
        description: 'Auto-generated project form code',
        dataType: 'string',
        group: 'project',
        isGlobal: true,
        isMoney: false,
        width: 180,
        isEditableByDefault: false,
      },
      {
        key: 'vendor',
        name: 'Vendor',
        description: 'Assigned vendor for this item',
        dataType: 'string',
        group: 'vendor',
        isGlobal: true,
        isMoney: false,
        width: 220,
        isEditableByDefault: true,
      },
      {
        key: 'orderType',
        name: 'Order Type',
        description: 'Type of order placed with vendor',
        dataType: 'string',
        group: 'vendor',
        isGlobal: true,
        isMoney: false,
        width: 200,
        isEditableByDefault: true,
      },
      {
        key: 'poSignStatus',
        name: 'PO Sign Status',
        description: 'Purchase order signature status',
        dataType: 'enum',
        group: 'status',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'pfSignStatus',
        name: 'PF Sign Status',
        description: 'Project form signature status',
        dataType: 'enum',
        group: 'status',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'status',
        name: 'Status',
        description: 'Current project item status',
        dataType: 'enum',
        group: 'status',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'std',
        name: 'STD',
        description: 'Start To Deliver date',
        dataType: 'date',
        group: 'dates',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'etd',
        name: 'ETD',
        description: 'Expected To Deliver date',
        dataType: 'date',
        group: 'dates',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'rtd',
        name: 'RTD',
        description: 'Ready To Deliver date',
        dataType: 'date',
        group: 'dates',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'rtr',
        name: 'RTR',
        description: 'Ready To Receive date',
        dataType: 'date',
        group: 'dates',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'ftd',
        name: 'FTD',
        description: 'Final Target Delivery date',
        dataType: 'date',
        group: 'dates',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'pfUsd',
        name: 'PF USD',
        description: 'Project fee in USD',
        dataType: 'decimal',
        group: 'money',
        isGlobal: true,
        isMoney: true,
        width: 120,
        isEditableByDefault: true,
      },
      {
        key: 'pfTl',
        name: 'PF TL',
        description: 'Project fee in Turkish Lira',
        dataType: 'decimal',
        group: 'money',
        isGlobal: true,
        isMoney: true,
        width: 120,
        isEditableByDefault: true,
      },
      {
        key: 'paymentRule',
        name: 'Payment Rule',
        description: 'Payment terms and conditions',
        dataType: 'string',
        group: 'logistics',
        isGlobal: true,
        isMoney: false,
        width: 180,
        isEditableByDefault: true,
      },
      {
        key: 'containerNo',
        name: 'Container No',
        description: 'Container number for shipping',
        dataType: 'string',
        group: 'logistics',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'containerDate',
        name: 'Container Date',
        description: 'Container shipping date',
        dataType: 'date',
        group: 'logistics',
        isGlobal: true,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      }
    ];

    for (const column of columns) {
      await prisma.columnRegistry.upsert({
        where: { key: column.key },
        update: column,
        create: column,
      });
      console.log(`  ✓ Column: ${column.key} (${column.group})`);
    }

    // 4. SEED ACTION REGISTRY
    console.log('⚡ Seeding Action Registry...');
    const actions = [
      {
        key: 'view',
        name: 'View',
        description: 'Read-only access to view data',
        category: 'crud',
      },
      {
        key: 'edit',
        name: 'Edit',
        description: 'Modify existing records',
        category: 'crud',
        parentKey: 'view',
      },
      {
        key: 'create',
        name: 'Create',
        description: 'Create new records',
        category: 'crud',
        parentKey: 'view',
      },
      {
        key: 'delete',
        name: 'Delete',
        description: 'Delete records',
        category: 'crud',
        parentKey: 'view',
      }
    ];

    const actionMap = new Map<string, string>();

    for (const actionData of actions) {
      const { parentKey, ...action } = actionData;
      const parentId = parentKey ? actionMap.get(parentKey) : null;

      const createdAction = await prisma.actionRegistry.upsert({
        where: { key: action.key },
        update: action,
        create: { ...action, parentId },
      });

      actionMap.set(action.key, createdAction.id);
      console.log(`  ✓ Action: ${action.key}`);
    }

    // 5. SEED DEFAULT ROLE PERMISSIONS - PROJECTS ONLY
    console.log('🔐 Seeding Default Role Permissions (Projects Only)...');

    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
    });

    // Default page access for Projects
    const defaultPageAccess = {
      ADMIN: ['project-tracking.projects'],
      FINANCE: ['project-tracking.projects'],
      PM: ['project-tracking.projects'],
      MILLWORK: ['project-tracking.projects'],
      IMAGE: ['project-tracking.projects'],
      CEILING: ['project-tracking.projects'],
      CLIENT: [],
      EMPLOYEE: []
    };

    // Default table access for Projects
    const defaultTableAccess = {
      ADMIN: { 'operational-board-grid': ['view', 'create', 'edit', 'delete'] },
      FINANCE: { 'operational-board-grid': ['view', 'edit'] },
      PM: { 'operational-board-grid': ['view', 'edit'] },
      MILLWORK: { 'operational-board-grid': ['view', 'edit'] },
      IMAGE: { 'operational-board-grid': ['view', 'edit'] },
      CEILING: { 'operational-board-grid': ['view', 'edit'] },
      CLIENT: {},
      EMPLOYEE: {}
    };

    // Create role page access
    for (const role of roles) {
      const pageKeys = defaultPageAccess[role.name] || [];

      for (const pageKey of pageKeys) {
        const pageId = pageMap.get(pageKey);
        if (pageId) {
          await prisma.rolePageAccess.upsert({
            where: {
              roleId_pageId: {
                roleId: role.id,
                pageId,
              },
            },
            update: { hasAccess: true },
            create: {
              roleId: role.id,
              pageId,
              hasAccess: true,
            },
          });
        }
      }
      console.log(`  ✓ Page access configured for role: ${role.name} (${pageKeys.length} pages)`);
    }

    // Create role table access
    for (const role of roles) {
      const tableAccess = defaultTableAccess[role.name] || {};

      for (const [tableKey, actionKeys] of Object.entries(tableAccess)) {
        const tableId = tableMap.get(tableKey);
        if (!tableId) continue;

        for (const actionKey of actionKeys) {
          const actionId = actionMap.get(actionKey);
          if (!actionId) continue;

          await prisma.roleTableAccess.upsert({
            where: {
              roleId_tableId_actionId: {
                roleId: role.id,
                tableId,
                actionId,
              },
            },
            update: { hasAccess: true },
            create: {
              roleId: role.id,
              tableId,
              actionId,
              hasAccess: true,
            },
          });
        }
      }
      console.log(`  ✓ Table access configured for role: ${role.name} (${Object.keys(tableAccess).length} tables)`);
    }

    console.log('');
    console.log('🎉 Projects-Only Access Control Registry seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • 1 page registered (Projects)`);
    console.log(`   • 1 table registered (Operational Board)`);
    console.log(`   • ${columns.length} columns registered (Projects columns)`);
    console.log(`   • ${actions.length} actions registered`);
    console.log(`   • ${roles.length} roles configured with default permissions`);
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding projects permissions:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedProjectsPermissions();
  } catch (error) {
    console.error('Seed script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedProjectsPermissions };