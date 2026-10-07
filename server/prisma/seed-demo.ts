import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting demo seed...\n');

  // ============ VENDORS ============
  const vendorData = [
    { code: 'V001', name: 'Artisan Woodworks' },
    { code: 'V002', name: 'Global Shelving Co.' },
    { code: 'V003', name: 'Premium Ceilings Ltd.' },
    { code: 'V004', name: 'Istanbul Furniture Hub' },
    { code: 'V005', name: 'Anatolian Decor' },
    { code: 'V006', name: 'Euro Millwork GmbH' },
    { code: 'V007', name: 'Delta Image Systems' },
    { code: 'V008', name: 'Marble & Granite Works' },
    { code: 'V009', name: 'Pacific Trading LLC' },
    { code: 'V010', name: 'Nordic Design Supply' },
  ];

  const vendors: any[] = [];
  for (const v of vendorData) {
    const vendor = await prisma.vendor.upsert({
      where: { id: v.code },
      update: {},
      create: { code: v.code, name: v.name },
    });
    vendors.push(vendor);
  }
  console.log(`✅ ${vendors.length} vendors created`);

  // ============ CUSTOM TYPES ============
  const customTypeData = [
    { name: 'Granite', code: 'GRANITE', description: 'Granite countertops and surfaces' },
    { name: 'Steel Frames', code: 'STEEL', description: 'Structural steel framing' },
    { name: 'Glass Panels', code: 'GLASS', description: 'Tempered glass panels and partitions' },
  ];

  const customTypes: any[] = [];
  for (const ct of customTypeData) {
    const existing = await prisma.customProjectType.findUnique({ where: { code: ct.code } });
    if (!existing) {
      const created = await prisma.customProjectType.create({ data: ct });
      customTypes.push(created);
    } else {
      customTypes.push(existing);
    }
  }
  console.log(`✅ ${customTypes.length} custom types created`);

  // ============ ROLES ============
  const roleData = [
    { name: 'Admin', isSystem: true },
    { name: 'Project Manager', isSystem: false },
    { name: 'Warehouse', isSystem: false },
    { name: 'Accounting', isSystem: false },
    { name: 'Viewer', isSystem: false },
  ];

  const roles: any[] = [];
  for (const r of roleData) {
    const existing = await prisma.role.findUnique({ where: { name: r.name } });
    if (existing) {
      roles.push(existing);
    } else {
      const created = await prisma.role.create({ data: r });
      roles.push(created);
    }
  }
  console.log(`✅ ${roles.length} roles created`);

  // ============ PAGE PERMISSIONS FOR ALL ROLES ============
  const allPageKeys = [
    'dashboard', 'operational_board', 'missing_extra', 'direct_order',
    'suppliers_vendors', 'supplier_total', 'project_total',
    'admin_roles_permissions', 'admin_activity_log',
    'trust_expenses', 'expenses_p', 'expenses_direct_order', 'expenses_missing_extra',
  ];

  // Ensure all pages exist in registry
  for (const key of allPageKeys) {
    await prisma.pageRegistry.upsert({
      where: { key },
      create: { key, name: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
      update: {},
    });
  }

  // Role permission map
  const rolePageMap: Record<string, string[]> = {
    'Admin': allPageKeys, // all pages
    'Project Manager': ['dashboard', 'operational_board', 'missing_extra', 'direct_order', 'suppliers_vendors', 'supplier_total', 'project_total', 'trust_expenses', 'expenses_p', 'expenses_direct_order', 'expenses_missing_extra'],
    'Warehouse': ['dashboard', 'operational_board', 'missing_extra', 'direct_order'],
    'Accounting': ['dashboard', 'suppliers_vendors', 'supplier_total', 'project_total', 'expenses_p', 'expenses_direct_order', 'expenses_missing_extra', 'trust_expenses'],
    'Viewer': ['dashboard', 'operational_board'],
  };

  for (const role of roles) {
    const allowedPages = rolePageMap[role.name] || [];
    for (const pageKey of allPageKeys) {
      const page = await prisma.pageRegistry.findUnique({ where: { key: pageKey } });
      if (!page) continue;
      await prisma.rolePageAccess.upsert({
        where: { roleId_pageId: { roleId: role.id, pageId: page.id } },
        create: { roleId: role.id, pageId: page.id, hasAccess: allowedPages.includes(pageKey) },
        update: { hasAccess: allowedPages.includes(pageKey) },
      });
    }
  }
  console.log('✅ Page permissions configured for all roles');

  // ============ USERS ============
  const passwordHash = await bcrypt.hash('Demo123!', 10);
  const adminRole = roles.find(r => r.name === 'Admin')!;
  const pmRole = roles.find(r => r.name === 'Project Manager')!;
  const warehouseRole = roles.find(r => r.name === 'Warehouse')!;
  const accountingRole = roles.find(r => r.name === 'Accounting')!;
  const viewerRole = roles.find(r => r.name === 'Viewer')!;

  const userData = [
    { email: 'admin@trust-lines.com', name: 'Hamza Admin', roleId: adminRole.id, username: 'admin' },
    { email: 'pm@trust-lines.com', name: 'Ahmet Yilmaz', roleId: pmRole.id, username: 'ahmet' },
    { email: 'warehouse@trust-lines.com', name: 'Mehmet Demir', roleId: warehouseRole.id, username: 'mehmet' },
    { email: 'accounting@trust-lines.com', name: 'Ayse Kaya', roleId: accountingRole.id, username: 'ayse' },
    { email: 'viewer@trust-lines.com', name: 'Fatma Ozturk', roleId: viewerRole.id, username: 'fatma' },
  ];

  const users: any[] = [];
  for (const u of userData) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      users.push(existing);
    } else {
      const created = await prisma.user.create({
        data: { ...u, passwordHash, forcePasswordChange: false, isActive: true },
      });
      users.push(created);
    }
  }
  console.log(`✅ ${users.length} users created (password: Demo123!)`);

  // ============ HELPER FUNCTIONS ============
  const randomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
  const randomDecimal = (min: number, max: number) => +(min + Math.random() * (max - min)).toFixed(2);
  const randomDate = (daysAgo: number, daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo + Math.floor(Math.random() * (daysAgo + daysAhead)));
    return d;
  };
  const types: any[] = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];
  const statuses: any[] = ['NOT_ORDERED', 'ORDERED', 'ASSEMBLY', 'READY_TO_RECEIVE', 'RECEIVED', 'SENT_TO_TLINES', 'SENT'];
  const buckets: any[] = ['TLINES_NE', 'TLINES_SE', 'CVW', 'TLINES_NW'];
  const orderTypes = ['FOB', 'CIF', 'EXW', 'DDP', 'DAP'];

  // ============ MAIN PROJECTS + ITEMS ============
  const projectData = [
    { bucket: 'TLINES_NE', projectNo: 'NE-2024-001', name: 'Brooklyn Heights Residence' },
    { bucket: 'TLINES_NE', projectNo: 'NE-2024-002', name: 'Manhattan Loft Renovation' },
    { bucket: 'TLINES_NE', projectNo: 'NE-2024-003', name: 'Queens Office Complex' },
    { bucket: 'TLINES_SE', projectNo: 'SE-2024-001', name: 'Miami Beach Hotel' },
    { bucket: 'TLINES_SE', projectNo: 'SE-2024-002', name: 'Atlanta Corporate Center' },
    { bucket: 'CVW', projectNo: 'CVW-2024-001', name: 'Chicago Waterfront Villa' },
    { bucket: 'CVW', projectNo: 'CVW-2024-002', name: 'Denver Mountain Lodge' },
    { bucket: 'TLINES_NW', projectNo: 'SC-2024-001', name: 'Dallas Office Tower' },
    { bucket: 'TLINES_NW', projectNo: 'SC-2024-002', name: 'Houston Residential Complex' },
    { bucket: 'TLINES_NE', projectNo: 'NE-2024-004', name: 'Connecticut Beach House' },
  ];

  const projects: any[] = [];
  for (const p of projectData) {
    const existing = await prisma.project.findFirst({ where: { projectNo: p.projectNo, bucket: p.bucket as any } });
    if (existing) {
      projects.push(existing);
      continue;
    }
    const project = await prisma.project.create({
      data: {
        bucket: p.bucket as any,
        projectNo: p.projectNo,
        name: p.name,
        address: `${Math.floor(Math.random() * 999) + 1} Main Street`,
        types: ['MILLWORK', 'SHELVING', 'CEILING'],
        status: randomItem(['PRE_PROJECT', 'IN_PROGRESS', 'DONE'] as any[]),
        isUrgent: Math.random() > 0.7,
        containerDate: Math.random() > 0.5 ? randomDate(10, 30) : null,
      },
    });
    projects.push(project);
  }
  console.log(`✅ ${projects.length} main projects created`);

  // Create items for each project (3-6 items each)
  let itemCount = 0;
  for (const project of projects) {
    const existingItems = await prisma.projectItem.count({ where: { projectId: project.id } });
    if (existingItems > 0) continue;

    const numItems = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numItems; i++) {
      const useCustom = Math.random() > 0.8 && customTypes.length > 0;
      const status = randomItem(statuses);
      await prisma.projectItem.create({
        data: {
          projectId: project.id,
          type: useCustom ? null : randomItem(types),
          customTypeId: useCustom ? randomItem(customTypes).id : null,
          vendorId: randomItem(vendors).id,
          orderType: randomItem(orderTypes),
          status,
          std: ['ORDERED', 'ASSEMBLY', 'READY_TO_RECEIVE', 'SENT_TO_TLINES', 'SENT'].includes(status) ? randomDate(30, 0) : null,
          etd: randomDate(0, 60),
          rtd: ['READY_TO_RECEIVE', 'SENT_TO_TLINES', 'SENT'].includes(status) ? randomDate(10, 0) : null,
          ftd: ['SENT_TO_TLINES', 'SENT'].includes(status) ? randomDate(5, 0) : null,
          pfUsd: randomDecimal(500, 25000),
          pfTl: randomDecimal(10000, 500000),
          containerNo: Math.random() > 0.5 ? `CNT-${Math.floor(Math.random() * 9000 + 1000)}` : null,
          pfSignStatus: randomItem(['NOT_SIGNED', 'READY_TO_SIGN', 'SIGNED'] as any[]),
          poSignStatus: randomItem(['NOT_SIGNED', 'READY_TO_SIGN', 'SIGNED'] as any[]),
          paymentRule: randomItem(['30 days', '60 days', '50% advance', 'COD', null]),
          paidUsd1: Math.random() > 0.5 ? randomDecimal(200, 10000) : null,
          paidTl1: Math.random() > 0.5 ? randomDecimal(5000, 200000) : null,
        },
      });
      itemCount++;
    }
  }
  console.log(`✅ ${itemCount} project items created`);

  // ============ DIRECT ORDER PROJECTS + ITEMS ============
  const doProjectData = [
    { bucket: 'TLINES_NE', projectNo: 'DO-NE-001', name: 'Custom Cabinet Order - Brooklyn' },
    { bucket: 'TLINES_NE', projectNo: 'DO-NE-002', name: 'Lighting Package - Manhattan' },
    { bucket: 'TLINES_SE', projectNo: 'DO-SE-001', name: 'Tile Import - Miami' },
    { bucket: 'CVW', projectNo: 'DO-CVW-001', name: 'Hardware Supply - Chicago' },
    { bucket: 'TLINES_NW', projectNo: 'DO-SC-001', name: 'Plumbing Fixtures - Dallas' },
  ];

  const doProjects: any[] = [];
  for (const p of doProjectData) {
    const existing = await prisma.directOrderProject.findFirst({ where: { projectNo: p.projectNo, bucket: p.bucket as any } });
    if (existing) { doProjects.push(existing); continue; }
    const proj = await prisma.directOrderProject.create({
      data: {
        bucket: p.bucket as any, projectNo: p.projectNo, name: p.name,
        address: `${Math.floor(Math.random() * 999)} Commerce Blvd`,
        types: ['MILLWORK', 'FURNITURE'],
        status: randomItem(['PRE_PROJECT', 'IN_PROGRESS'] as any[]),
      },
    });
    doProjects.push(proj);
  }
  console.log(`✅ ${doProjects.length} direct order projects created`);

  let doItemCount = 0;
  for (const proj of doProjects) {
    const existingItems = await prisma.directOrderItem.count({ where: { projectId: proj.id } });
    if (existingItems > 0) continue;
    const numItems = 2 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numItems; i++) {
      const status = randomItem(statuses);
      await prisma.directOrderItem.create({
        data: {
          projectId: proj.id,
          type: randomItem(types),
          vendorId: randomItem(vendors).id,
          orderType: randomItem(orderTypes),
          status,
          std: status !== 'NOT_ORDERED' ? randomDate(20, 0) : null,
          etd: randomDate(0, 45),
          pfUsd: randomDecimal(300, 15000),
          pfTl: randomDecimal(8000, 300000),
          containerNo: Math.random() > 0.4 ? `CNT-${Math.floor(Math.random() * 9000 + 1000)}` : null,
          paymentRule: randomItem(['30 days', '60 days', 'COD', null]),
        },
      });
      doItemCount++;
    }
  }
  console.log(`✅ ${doItemCount} direct order items created`);

  // ============ MISSING & EXTRA CASES + ITEMS ============
  let meCount = 0;
  for (let i = 0; i < 6; i++) {
    const baseProject = projects[i];
    const caseType = randomItem(['MISSING', 'EXTRA', 'REPLACEMENT'] as any[]);
    const code = `${baseProject.projectNo}-${caseType[0]}${i + 1}`;

    const existing = await prisma.missingExtraCase.findUnique({ where: { derivedProjectCode: code } });
    if (existing) continue;

    const meCase = await prisma.missingExtraCase.create({
      data: {
        baseProjectId: baseProject.id,
        baseProjectNo: i + 1,
        baseProjectName: baseProject.name,
        section: baseProject.bucket,
        caseType,
        caseIndex: i + 1,
        derivedProjectCode: code,
        isUrgent: Math.random() > 0.6,
        types: ['MILLWORK', 'SHELVING'],
      },
    });

    const numItems = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numItems; j++) {
      const status = randomItem(statuses);
      await prisma.missingExtraItem.create({
        data: {
          caseId: meCase.id,
          type: randomItem(types),
          vendorId: randomItem(vendors).id,
          orderType: randomItem(orderTypes),
          status,
          std: status !== 'NOT_ORDERED' ? randomDate(15, 0) : null,
          etd: randomDate(0, 40),
          pfUsd: randomDecimal(200, 8000),
          pfTl: randomDecimal(5000, 150000),
          paymentRule: randomItem(['30 days', 'COD', null]),
        },
      });
      meCount++;
    }
  }
  console.log(`✅ ${meCount} missing & extra items created`);

  // ============ TRUST EXPENSE PROJECTS + ITEMS ============
  const teProjectData = [
    { bucket: 'TLINES_NE', projectNo: 'TE-NE-001', name: 'Trust - Brooklyn Heights' },
    { bucket: 'TLINES_NE', projectNo: 'TE-NE-002', name: 'Trust - Manhattan Loft' },
    { bucket: 'TLINES_SE', projectNo: 'TE-SE-001', name: 'Trust - Miami Beach' },
    { bucket: 'CVW', projectNo: 'TE-CVW-001', name: 'Trust - Chicago Waterfront' },
  ];

  const teProjects: any[] = [];
  for (const p of teProjectData) {
    const existing = await prisma.trustExpenseProject.findFirst({ where: { projectNo: p.projectNo, bucket: p.bucket as any } });
    if (existing) { teProjects.push(existing); continue; }
    const proj = await prisma.trustExpenseProject.create({
      data: {
        bucket: p.bucket as any, projectNo: p.projectNo, name: p.name,
        address: `${Math.floor(Math.random() * 999)} Trust Ave`,
        types: ['MILLWORK', 'CEILING', 'FURNITURE'],
      },
    });
    teProjects.push(proj);
  }
  console.log(`✅ ${teProjects.length} trust expense projects created`);

  let teItemCount = 0;
  for (const proj of teProjects) {
    const existingItems = await prisma.trustExpenseItem.count({ where: { projectId: proj.id } });
    if (existingItems > 0) continue;
    const numItems = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numItems; i++) {
      const status = randomItem(statuses);
      await prisma.trustExpenseItem.create({
        data: {
          projectId: proj.id,
          type: randomItem(types),
          vendorId: randomItem(vendors).id,
          orderType: randomItem(orderTypes),
          status,
          std: status !== 'NOT_ORDERED' ? randomDate(25, 0) : null,
          etd: randomDate(0, 50),
          rtrd: ['READY_TO_RECEIVE', 'SENT'].includes(status) ? randomDate(5, 0) : null,
          ftd: status === 'SENT' ? randomDate(3, 0) : null,
          expensesUsd: randomDecimal(500, 20000),
          expensesTl: randomDecimal(10000, 400000),
          shelvesLocation: Math.random() > 0.5 ? `S${Math.floor(Math.random() * 20 + 1)}-R${Math.floor(Math.random() * 10 + 1)}` : null,
          containerNo: Math.random() > 0.4 ? `CNT-${Math.floor(Math.random() * 9000 + 1000)}` : null,
          invoice: Math.random() > 0.5 ? `INV-${Math.floor(Math.random() * 90000 + 10000)}` : null,
          paymentRule: randomItem(['30 days', '60 days', '50% advance', null]),
          sortOrder: i * 1000,
        },
      });
      teItemCount++;
    }
  }
  console.log(`✅ ${teItemCount} trust expense items created`);

  // ============ EXPENSES P PROJECTS + ITEMS ============
  const expPData = [
    { bucket: 'TLINES_NE', projectNo: 'NE-2024-001', name: 'Exp-P Brooklyn Heights' },
    { bucket: 'TLINES_NE', projectNo: 'NE-2024-002', name: 'Exp-P Manhattan Loft' },
    { bucket: 'TLINES_SE', projectNo: 'SE-2024-001', name: 'Exp-P Miami Beach' },
    { bucket: 'CVW', projectNo: 'CVW-2024-001', name: 'Exp-P Chicago Villa' },
    { bucket: 'TLINES_NW', projectNo: 'SC-2024-001', name: 'Exp-P Dallas Tower' },
  ];

  const expPProjects: any[] = [];
  for (const p of expPData) {
    const existing = await prisma.expensesPProject.findFirst({ where: { projectNo: p.projectNo, bucket: p.bucket as any } });
    if (existing) { expPProjects.push(existing); continue; }
    const proj = await prisma.expensesPProject.create({
      data: { bucket: p.bucket as any, projectNo: p.projectNo, name: p.name },
    });
    expPProjects.push(proj);
  }
  console.log(`✅ ${expPProjects.length} expenses P projects created`);

  let expPItemCount = 0;
  for (const proj of expPProjects) {
    const existingItems = await prisma.expensesPItem.count({ where: { projectId: proj.id } });
    if (existingItems > 0) continue;
    const numItems = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numItems; i++) {
      const status = randomItem(['NOT_ORDERED', 'ORDERED', 'READY_TO_RECEIVE', 'SENT_TO_TLINES']) as any;
      await prisma.expensesPItem.create({
        data: {
          projectId: proj.id,
          type: randomItem(types),
          vendorId: randomItem(vendors).id,
          orderType: randomItem(orderTypes),
          status,
          std: status !== 'NOT_ORDERED' ? randomDate(20, 0) : null,
          etd: randomDate(0, 40),
          rtrd: status === 'READY_TO_RECEIVE' ? randomDate(5, 0) : null,
          ftd: status === 'SENT_TO_TLINES' ? randomDate(3, 0) : null,
          expensesUsd: randomDecimal(300, 18000),
          expensesTl: randomDecimal(8000, 350000),
          shelvesLoc: Math.random() > 0.5 ? `Shelf-${Math.floor(Math.random() * 50 + 1)}` : null,
          containerNo: Math.random() > 0.4 ? `CNT-${Math.floor(Math.random() * 9000 + 1000)}` : null,
          invoiceSit: randomItem(['Pending', 'Received', 'Approved', null]),
          paymentRule: randomItem(['30 days', '60 days', 'COD', null]),
        },
      });
      expPItemCount++;
    }
  }
  console.log(`✅ ${expPItemCount} expenses P items created`);

  // ============ EXPENSES DIRECT ORDER PROJECTS + ITEMS ============
  const expDOData = [
    { bucket: 'TLINES_NE', projectNo: 'DO-NE-001', name: 'Exp-DO Cabinet Order' },
    { bucket: 'TLINES_NE', projectNo: 'DO-NE-002', name: 'Exp-DO Lighting Package' },
    { bucket: 'TLINES_SE', projectNo: 'DO-SE-001', name: 'Exp-DO Tile Import' },
    { bucket: 'CVW', projectNo: 'DO-CVW-001', name: 'Exp-DO Hardware Supply' },
  ];

  const expDOProjects: any[] = [];
  for (const p of expDOData) {
    const existing = await prisma.expensesDirectOrderProject.findFirst({ where: { projectNo: p.projectNo, bucket: p.bucket as any } });
    if (existing) { expDOProjects.push(existing); continue; }
    const proj = await prisma.expensesDirectOrderProject.create({
      data: { bucket: p.bucket as any, projectNo: p.projectNo, name: p.name },
    });
    expDOProjects.push(proj);
  }
  console.log(`✅ ${expDOProjects.length} expenses DO projects created`);

  let expDOItemCount = 0;
  for (const proj of expDOProjects) {
    const existingItems = await prisma.expensesDirectOrderItem.count({ where: { projectId: proj.id } });
    if (existingItems > 0) continue;
    const numItems = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numItems; i++) {
      const status = randomItem(['NOT_ORDERED', 'ORDERED', 'READY_TO_RECEIVE', 'SENT_TO_TLINES']) as any;
      await prisma.expensesDirectOrderItem.create({
        data: {
          projectId: proj.id,
          type: randomItem(types),
          vendorId: randomItem(vendors).id,
          orderType: randomItem(orderTypes),
          status,
          std: status !== 'NOT_ORDERED' ? randomDate(15, 0) : null,
          etd: randomDate(0, 35),
          expensesUsd: randomDecimal(200, 12000),
          expensesTl: randomDecimal(5000, 250000),
          containerNo: Math.random() > 0.4 ? `CNT-${Math.floor(Math.random() * 9000 + 1000)}` : null,
          paymentRule: randomItem(['30 days', '60 days', null]),
        },
      });
      expDOItemCount++;
    }
  }
  console.log(`✅ ${expDOItemCount} expenses DO items created`);

  // ============ EXPENSES MISSING & EXTRA PROJECTS + ITEMS ============
  const expMEData = [
    { bucket: 'TLINES_NE', projectNo: 'NE-2024-001-M1', name: 'Exp-ME Brooklyn Missing' },
    { bucket: 'TLINES_NE', projectNo: 'NE-2024-002-E1', name: 'Exp-ME Manhattan Extra' },
    { bucket: 'TLINES_SE', projectNo: 'SE-2024-001-R1', name: 'Exp-ME Miami Replacement' },
  ];

  const expMEProjects: any[] = [];
  for (const p of expMEData) {
    const existing = await prisma.expensesMissingExtraProject.findFirst({ where: { projectNo: p.projectNo, bucket: p.bucket as any } });
    if (existing) { expMEProjects.push(existing); continue; }
    const proj = await prisma.expensesMissingExtraProject.create({
      data: { bucket: p.bucket as any, projectNo: p.projectNo, name: p.name },
    });
    expMEProjects.push(proj);
  }
  console.log(`✅ ${expMEProjects.length} expenses ME projects created`);

  let expMEItemCount = 0;
  for (const proj of expMEProjects) {
    const existingItems = await prisma.expensesMissingExtraItem.count({ where: { projectId: proj.id } });
    if (existingItems > 0) continue;
    const numItems = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numItems; i++) {
      const status = randomItem(['NOT_ORDERED', 'ORDERED', 'READY_TO_RECEIVE', 'SENT_TO_TLINES']) as any;
      await prisma.expensesMissingExtraItem.create({
        data: {
          projectId: proj.id,
          type: randomItem(types),
          vendorId: randomItem(vendors).id,
          orderType: randomItem(orderTypes),
          status,
          std: status !== 'NOT_ORDERED' ? randomDate(10, 0) : null,
          etd: randomDate(0, 30),
          expensesUsd: randomDecimal(150, 8000),
          expensesTl: randomDecimal(3000, 150000),
          containerNo: Math.random() > 0.4 ? `CNT-${Math.floor(Math.random() * 9000 + 1000)}` : null,
          paymentRule: randomItem(['30 days', 'COD', null]),
        },
      });
      expMEItemCount++;
    }
  }
  console.log(`✅ ${expMEItemCount} expenses ME items created`);

  // ============ PAYMENT RULE MASTER ============
  const paymentRules = ['30 days', '60 days', '90 days', '50% advance', 'COD', 'Net 15', 'Net 30'];
  for (const rule of paymentRules) {
    await prisma.paymentRuleMaster.upsert({
      where: { value: rule },
      create: { value: rule },
      update: {},
    });
  }
  console.log(`✅ ${paymentRules.length} payment rules created`);

  console.log('\n🎉 Demo seed completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('  Admin:    admin@trust-lines.com / Demo123!');
  console.log('  PM:       pm@trust-lines.com / Demo123!');
  console.log('  Warehouse: warehouse@trust-lines.com / Demo123!');
  console.log('  Accounting: accounting@trust-lines.com / Demo123!');
  console.log('  Viewer:   viewer@trust-lines.com / Demo123!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
