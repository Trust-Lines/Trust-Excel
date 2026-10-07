import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedEnterprisePermissions() {
  console.log('🌱 Seeding Enterprise Access Control Registry...');

  try {
    // 1. SEED PAGE REGISTRY
    console.log('📄 Seeding Page Registry...');
    const pages = [
      {
        key: 'dashboard',
        name: 'Dashboard',
        description: 'Modern dashboard with KPIs, action center, and data issues',
      },
      {
        key: 'project-tracking',
        name: 'Project Tracking',
        description: 'Parent page for all project tracking functionality',
      },
      {
        key: 'project-tracking.projects',
        name: 'Operational Board',
        description: 'Main project management interface for operational board projects',
        parentKey: 'project-tracking',
      },
      {
        key: 'project-tracking.missing-extra',
        name: 'Missing & Extra',
        description: 'Management interface for missing and extra project items',
        parentKey: 'project-tracking',
      },
      {
        key: 'project-tracking.direct-order',
        name: 'Direct Order',
        description: 'Specialized operational board for direct orders',
        parentKey: 'project-tracking',
      },
      {
        key: 'supplier-tracking',
        name: 'Supplier Tracking',
        description: 'Multi-tab supplier/vendor interface with specialized accounting',
      },
      {
        key: 'supplier-tracking.p-tab',
        name: 'Supplier P Tab',
        description: 'Projects/Purchase Forms tab for supplier tracking',
        parentKey: 'supplier-tracking',
      },
      {
        key: 'supplier-tracking.me-tab',
        name: 'Supplier ME Tab',
        description: 'Missing & Extra tab for supplier tracking',
        parentKey: 'supplier-tracking',
      },
      {
        key: 'supplier-tracking.do-tab',
        name: 'Supplier DO Tab',
        description: 'Direct Orders tab for supplier tracking',
        parentKey: 'supplier-tracking',
      },
      {
        key: 'admin',
        name: 'Admin',
        description: 'Administrative functions and system management',
      },
      {
        key: 'admin.roles',
        name: 'Admin Roles',
        description: 'Role and permission management interface',
        parentKey: 'admin',
      },
      {
        key: 'admin.users',
        name: 'Admin Users',
        description: 'User management and invitation interface',
        parentKey: 'admin',
      },
    ];

    const pageMap = new Map<string, string>();

    // Create pages in order (parents first)
    for (const pageData of pages) {
      const { parentKey, ...page } = pageData;
      const parentId = parentKey ? pageMap.get(parentKey) : null;

      const createdPage = await prisma.pageRegistry.upsert({
        where: { key: page.key },
        update: page,
        create: { ...page, parentId },
      });

      pageMap.set(page.key, createdPage.id);
      console.log(`  ✓ Page: ${page.key}`);
    }

    // 2. SEED TABLE REGISTRY
    console.log('📋 Seeding Table Registry...');
    const tables = [
      {
        key: 'operational-board-grid',
        name: 'Operational Board Grid',
        description: 'Main data grid for project management with multiple modes (projects, missing-extra, direct-order)',
        pageKey: 'project-tracking.projects',
      },
      {
        key: 'operational-board-missing-extra-grid',
        name: 'Missing & Extra Grid',
        description: 'Specialized grid for missing and extra project items',
        pageKey: 'project-tracking.missing-extra',
      },
      {
        key: 'operational-board-direct-order-grid',
        name: 'Direct Order Grid',
        description: 'Specialized grid for direct order project items',
        pageKey: 'project-tracking.direct-order',
      },
      {
        key: 'supplier-p-sheet',
        name: 'Supplier P Sheet',
        description: 'Projects/Purchase Forms grid for supplier tracking with accounting columns',
        pageKey: 'supplier-tracking.p-tab',
      },
      {
        key: 'supplier-me-sheet',
        name: 'Supplier ME Sheet',
        description: 'Missing & Extra items grid for supplier tracking with accounting columns',
        pageKey: 'supplier-tracking.me-tab',
      },
      {
        key: 'supplier-do-sheet',
        name: 'Supplier DO Sheet',
        description: 'Direct Orders grid for supplier tracking with accounting columns',
        pageKey: 'supplier-tracking.do-tab',
      },
      {
        key: 'payments-grid',
        name: 'Payments Grid',
        description: 'Payment tracking grid with due payments and installments',
        pageKey: 'supplier-tracking',
      },
      {
        key: 'accounting-grid',
        name: 'Accounting Grid',
        description: 'Financial accounting grid with paid amounts and remaining balances',
        pageKey: 'supplier-tracking',
      },
      {
        key: 'invoice-receipt-grid',
        name: 'Invoice Receipt Grid',
        description: 'Invoice and receipt tracking grid with transaction details',
        pageKey: 'supplier-tracking',
      },
      {
        key: 'project-block',
        name: 'Project Block',
        description: 'Individual project item row component with inline editing',
        pageKey: null, // Used across multiple pages
      },
      {
        key: 'admin-roles-grid',
        name: 'Admin Roles Grid',
        description: 'Role and permission management grid',
        pageKey: 'admin.roles',
      },
      {
        key: 'admin-users-grid',
        name: 'Admin Users Grid',
        description: 'User management grid with invitation and status controls',
        pageKey: 'admin.users',
      },
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

    // 3. SEED COLUMN REGISTRY - ALL COLUMNS (PRESERVE DOMAIN DATA)
    console.log('📊 Seeding Column Registry...');
    const columns = [
      // GLOBAL COLUMNS (Used across all operational grids)
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
      },

      // SUPPLIER-SPECIFIC COLUMNS (PRESERVE DOMAIN DATA)
      {
        key: 'paidUsd1',
        name: 'Paid USD 1st',
        description: 'First USD payment amount',
        dataType: 'decimal',
        group: 'accounting',
        isGlobal: false,
        isMoney: true,
        width: 120,
        isEditableByDefault: true,
      },
      {
        key: 'paidUsd2',
        name: 'Paid USD 2nd',
        description: 'Second USD payment amount',
        dataType: 'decimal',
        group: 'accounting',
        isGlobal: false,
        isMoney: true,
        width: 120,
        isEditableByDefault: true,
      },
      {
        key: 'paidTl1',
        name: 'Paid TL 1st',
        description: 'First Turkish Lira payment amount',
        dataType: 'decimal',
        group: 'accounting',
        isGlobal: false,
        isMoney: true,
        width: 120,
        isEditableByDefault: true,
      },
      {
        key: 'paidTl2',
        name: 'Paid TL 2nd',
        description: 'Second Turkish Lira payment amount',
        dataType: 'decimal',
        group: 'accounting',
        isGlobal: false,
        isMoney: true,
        width: 120,
        isEditableByDefault: true,
      },
      {
        key: 'remainingUsd',
        name: 'Remaining USD',
        description: 'Remaining USD balance (calculated)',
        dataType: 'decimal',
        group: 'accounting',
        isGlobal: false,
        isMoney: true,
        width: 140,
        isEditableByDefault: false,
      },
      {
        key: 'remainingTl',
        name: 'Remaining TL',
        description: 'Remaining Turkish Lira balance (calculated)',
        dataType: 'decimal',
        group: 'accounting',
        isGlobal: false,
        isMoney: true,
        width: 140,
        isEditableByDefault: false,
      },
      {
        key: 'notOrderedUsd',
        name: 'Not Ordered USD',
        description: 'Not yet ordered USD amount',
        dataType: 'decimal',
        group: 'accounting',
        isGlobal: false,
        isMoney: true,
        width: 140,
        isEditableByDefault: false,
      },
      {
        key: 'notOrderedTl',
        name: 'Not Ordered TL',
        description: 'Not yet ordered Turkish Lira amount',
        dataType: 'decimal',
        group: 'accounting',
        isGlobal: false,
        isMoney: true,
        width: 140,
        isEditableByDefault: false,
      },
      {
        key: 'transactionNo',
        name: 'Transaction No',
        description: 'Invoice transaction number',
        dataType: 'string',
        group: 'invoice',
        isGlobal: false,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'invoiceNumber',
        name: 'Invoice Number',
        description: 'Invoice number reference',
        dataType: 'string',
        group: 'invoice',
        isGlobal: false,
        isMoney: false,
        width: 140,
        isEditableByDefault: true,
      },
      {
        key: 'quickBook',
        name: 'QuickBook',
        description: 'QuickBook reference code',
        dataType: 'string',
        group: 'invoice',
        isGlobal: false,
        isMoney: false,
        width: 120,
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
        key: 'create',
        name: 'Create',
        description: 'Create new records',
        category: 'crud',
        parentKey: 'view',
      },
      {
        key: 'edit',
        name: 'Edit',
        description: 'Modify existing records',
        category: 'crud',
        parentKey: 'view',
      },
      {
        key: 'delete',
        name: 'Delete',
        description: 'Delete records',
        category: 'crud',
        parentKey: 'view',
      },
      {
        key: 'export',
        name: 'Export',
        description: 'Export data to external formats',
        category: 'system',
        parentKey: 'view',
      },
      {
        key: 'approve',
        name: 'Approve',
        description: 'Approve workflow items',
        category: 'workflow',
        parentKey: 'view',
      },
      {
        key: 'sign',
        name: 'Sign',
        description: 'Digitally sign documents',
        category: 'workflow',
        parentKey: 'view',
      },
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

    // 5. SEED DEFAULT ROLE PERMISSIONS - ALL ROLES/TABLES (PRESERVE DOMAIN DATA)
    console.log('🔐 Seeding Default Role Permissions...');

    const roles = await prisma.role.findMany({
      select: { id: true, name: true },
    });

    // Default page access by role - PRESERVE YSM/EXISTING BEHAVIOR
    const defaultPageAccess = {
      ADMIN: ['dashboard', 'project-tracking', 'project-tracking.projects', 'project-tracking.missing-extra', 'project-tracking.direct-order', 'supplier-tracking', 'supplier-tracking.p-tab', 'supplier-tracking.me-tab', 'supplier-tracking.do-tab', 'admin', 'admin.roles', 'admin.users'],
      FINANCE: ['dashboard', 'project-tracking', 'project-tracking.projects', 'project-tracking.missing-extra', 'project-tracking.direct-order', 'supplier-tracking', 'supplier-tracking.p-tab', 'supplier-tracking.me-tab', 'supplier-tracking.do-tab'],
      PM: ['dashboard', 'project-tracking', 'project-tracking.projects', 'project-tracking.missing-extra', 'project-tracking.direct-order'],
      MILLWORK: ['dashboard', 'project-tracking', 'project-tracking.projects', 'project-tracking.missing-extra', 'project-tracking.direct-order'],
      IMAGE: ['dashboard', 'project-tracking', 'project-tracking.projects', 'project-tracking.missing-extra', 'project-tracking.direct-order'],
      CEILING: ['dashboard', 'project-tracking', 'project-tracking.projects', 'project-tracking.missing-extra', 'project-tracking.direct-order'],
      CLIENT: ['dashboard'],
      EMPLOYEE: []
    };

    // Default table access by role - PRESERVE YSM/EXISTING BEHAVIOR
    const defaultTableAccess = {
      ADMIN: {
        'operational-board-grid': ['view', 'create', 'edit', 'delete', 'export'],
        'operational-board-missing-extra-grid': ['view', 'create', 'edit', 'delete', 'export'],
        'operational-board-direct-order-grid': ['view', 'create', 'edit', 'delete', 'export'],
        'supplier-p-sheet': ['view', 'create', 'edit', 'delete', 'export', 'approve'],
        'supplier-me-sheet': ['view', 'create', 'edit', 'delete', 'export'],
        'supplier-do-sheet': ['view', 'create', 'edit', 'delete', 'export'],
        'payments-grid': ['view', 'edit'],
        'accounting-grid': ['view', 'edit'],
        'invoice-receipt-grid': ['view', 'edit'],
        'admin-roles-grid': ['view', 'create', 'edit', 'delete'],
        'admin-users-grid': ['view', 'create', 'edit', 'delete'],
      },
      FINANCE: {
        'operational-board-grid': ['view', 'edit', 'export'],
        'operational-board-missing-extra-grid': ['view', 'edit', 'export'],
        'operational-board-direct-order-grid': ['view', 'edit', 'export'],
        'supplier-p-sheet': ['view', 'edit', 'export', 'approve'],
        'supplier-me-sheet': ['view', 'edit', 'export'],
        'supplier-do-sheet': ['view', 'edit', 'export'],
        'payments-grid': ['view', 'edit'],
        'accounting-grid': ['view', 'edit'],
        'invoice-receipt-grid': ['view', 'edit'],
      },
      PM: {
        'operational-board-grid': ['view', 'edit', 'export'],
        'operational-board-missing-extra-grid': ['view', 'create', 'edit', 'export'],
        'operational-board-direct-order-grid': ['view', 'create', 'edit', 'export'],
      },
      MILLWORK: {
        'operational-board-grid': ['view', 'edit'],
        'operational-board-missing-extra-grid': ['view', 'edit'],
        'operational-board-direct-order-grid': ['view', 'edit'],
      },
      IMAGE: {
        'operational-board-grid': ['view', 'edit'],
        'operational-board-missing-extra-grid': ['view', 'edit'],
        'operational-board-direct-order-grid': ['view', 'edit'],
      },
      CEILING: {
        'operational-board-grid': ['view', 'edit'],
        'operational-board-missing-extra-grid': ['view', 'edit'],
        'operational-board-direct-order-grid': ['view', 'edit'],
      },
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
    console.log('🎉 Enterprise Access Control Registry seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   • ${pages.length} pages registered`);
    console.log(`   • ${tables.length} tables registered`);
    console.log(`   • ${columns.length} columns registered`);
    console.log(`   • ${actions.length} actions registered`);
    console.log(`   • ${roles.length} roles configured with default permissions`);
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding enterprise permissions:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedEnterprisePermissions();
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

export { seedEnterprisePermissions };