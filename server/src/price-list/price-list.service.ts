import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { DropboxService } from '../dropbox/dropbox.service';
import { PfCodeGenerationService } from '../projects/services/pf-code-generation.service';
import { ProjectItemType } from '@prisma/client';


const PRICE_LIST_TYPE_MAP: Record<string, ProjectItemType> = {
  millwork: ProjectItemType.MILLWORK,
  shelving: ProjectItemType.SHELVING,
  ceiling: ProjectItemType.CEILING,
  image: ProjectItemType.IMAGE,
  furniture: ProjectItemType.FURNITURE,
  decoration: ProjectItemType.DECORATION,
};

// FIX 5: Role slug → display label mapping
const APPROVAL_ROLES = [
  'Production Manager',
  'Project Manager',
  'Sales & Coordination',
  'T Lines Project Manager',
  'T Lines General Manager',
];

const normaliseRole = (r: string): string | null => {
  const s = r.toLowerCase().replace(/[^a-z0-9 &]/g, ' ').replace(/\s+/g, ' ').trim();
  if (s.includes('production')) return 'Production Manager';
  if (s.includes('project manager') || s === 'project_manager') return 'Project Manager';
  if (s.includes('sales')) return 'Sales & Coordination';
  if (s.includes('tlines project') || s.includes('t lines project') || s === 'tlines_project_manager') return 'T Lines Project Manager';
  if (s.includes('general') || s === 'tlines_general_manager') return 'T Lines General Manager';
  return null;
};

// Vendor codes that use the M01/M02/M03 fixed system
const YSM_GOS_CODES = new Set(['YSM', 'GOS']);

// Default type_label lookup values (seeded on startup if missing)
const DEFAULT_TYPE_LABELS = [
  { value: 'STANDARD ITEMS / BASIC COLORS', sortOrder: 1 },
  { value: 'STANDARD ITEMS / SELECTIVE COLORS', sortOrder: 2 },
  { value: 'CUSTOM ITEMS / SELECTIVE COLORS', sortOrder: 3 },
];

// Map price list typeLabel → { mCode, orderType }
function getMillworkTypeInfo(typeLabel: string): { mCode: number; orderType: string } | null {
  const upper = (typeLabel ?? '').toUpperCase();
  if (upper.includes('CUSTOM')) return { mCode: 3, orderType: 'SELECTIVE / CUSTOM' };
  if (upper.includes('SELECTIVE')) return { mCode: 2, orderType: 'STANDARD / SELECTIVE' };
  if (upper.includes('BASIC') || upper.includes('STANDARD')) return { mCode: 1, orderType: 'STANDARD / BASIC' };
  return null;
}

@Injectable()
export class PriceListService implements OnModuleInit {
  private logoB64 = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly dropboxService: DropboxService,
    private readonly pfCodeService: PfCodeGenerationService,
  ) {
    // Try multiple possible logo paths (src vs dist, cwd-based)
    const candidates = [
      path.join(__dirname, 'logo.png'),
      // compiled to server/dist/price-list → asset stays in server/src (tsc doesn't copy it)
      path.join(__dirname, '..', '..', 'src', 'price-list', 'logo.png'),
      path.join(process.cwd(), 'server', 'src', 'price-list', 'logo.png'),
      path.join(process.cwd(), 'src', 'price-list', 'logo.png'),
      path.join(process.cwd(), 'dist', 'price-list', 'logo.png'),
    ];
    for (const p of candidates) {
      try {
        this.logoB64 = `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
        break;
      } catch { /* try next */ }
    }
  }

  async onModuleInit() {
    // Seed the 3 fixed type_label options if they don't exist yet
    for (const { value, sortOrder } of DEFAULT_TYPE_LABELS) {
      await this.prisma.priceListLookup.upsert({
        where: { field_value: { field: 'type_label', value } },
        update: { sortOrder },
        create: { field: 'type_label', value, sortOrder },
      }).catch(() => {});
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  /** Normalise formData to new typeBlocks structure (backward-compat) */
  private normaliseFormData(raw: any): any {
    if (!raw) return { header: {}, typeBlocks: [{ id: '_', typeLabel: '', categories: [] }], signatures: [] };
    if (Array.isArray(raw.typeBlocks)) return raw;
    // Old format: root-level typeBanner + categories
    return {
      ...raw,
      typeBlocks: [{ id: '_default', typeLabel: raw.typeBanner ?? '', categories: raw.categories ?? [] }],
    };
  }

  /** Iterate all items across typeBlocks */
  private* iterItems(form: any): Generator<any> {
    for (const block of form.typeBlocks ?? []) {
      for (const cat of block.categories ?? []) {
        for (const sub of cat.subCategories ?? []) {
          for (const grp of sub.groups ?? []) {
            for (const item of grp.items ?? []) {
              yield item;
            }
          }
        }
      }
    }
  }

  /** Strip HTML tags for plain text */
  private stripHtml(html: string): string {
    return String(html ?? '').replace(/<[^>]+>/g, '');
  }

  // ── Lookups ────────────────────────────────────────────────────────────

  async getProjects() {
    return this.prisma.project.findMany({
      where: { deletedAt: null },
      select: {
        id: true, projectNo: true, name: true, address: true,
        bucket: true, types: true, clientName: true,
        dropboxPath: true, logoUrl: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLookups(field?: string) {
    return this.prisma.priceListLookup.findMany({
      where: field ? { field } : undefined,
      orderBy: [{ field: 'asc' }, { sortOrder: 'asc' }, { value: 'asc' }],
    });
  }

  async upsertLookup(field: string, value: string, sortOrder?: number) {
    return this.prisma.priceListLookup.upsert({
      where: { field_value: { field, value } },
      update: { sortOrder: sortOrder ?? 0 },
      create: { field, value, sortOrder: sortOrder ?? 0 },
    });
  }

  async batchUpsertLookups(items: Array<{ field: string; value: string; sortOrder?: number }>) {
    const deduped = [...new Map(items.map((i) => [`${i.field}::${i.value}`, i])).values()].filter(
      (i) => i.field && i.value && i.value.trim(),
    );
    const results = await Promise.allSettled(
      deduped.map((i) =>
        this.prisma.priceListLookup.upsert({
          where: { field_value: { field: i.field, value: i.value.trim() } },
          update: { sortOrder: i.sortOrder ?? 0 },
          create: { field: i.field, value: i.value.trim(), sortOrder: i.sortOrder ?? 0 },
        }),
      ),
    );
    return { saved: results.filter((r) => r.status === 'fulfilled').length };
  }

  async setExactLookup(field: string, value: string) {
    await this.prisma.priceListLookup.deleteMany({ where: { field } });
    if (value && value.trim()) {
      return this.prisma.priceListLookup.create({ data: { field, value: value.trim() } });
    }
  }

  // ── Entries CRUD ──────────────────────────────────────────────────────

  private async fetchApprovals(entryIds: string[]): Promise<Record<string, any[]>> {
    if (entryIds.length === 0) return {};
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT pla.id, pla.price_list_entry_id AS "priceListEntryId",
             pla.role, pla.user_id AS "userId", pla.status, pla.note,
             pla.signed_at AS "signedAt", pla.created_at AS "createdAt", pla.updated_at AS "updatedAt",
             u.name AS "userName"
      FROM price_list_approvals pla
      LEFT JOIN users u ON u.id = pla.user_id
      WHERE pla.price_list_entry_id = ANY(${entryIds})
    `;
    const map: Record<string, any[]> = {};
    for (const r of rows) {
      (map[r.priceListEntryId] ??= []).push(r);
    }
    return map;
  }

  async getEntries(projectId?: string) {
    const entries = await this.prisma.priceListEntry.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: { select: { id: true, projectNo: true, name: true, address: true, clientName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const approvalsMap = await this.fetchApprovals(entries.map(e => e.id));
    return entries.map(e => ({ ...e, approvals: approvalsMap[e.id] ?? [] }));
  }

  async getEntry(id: string) {
    const entry = await this.prisma.priceListEntry.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, projectNo: true, name: true, address: true, clientName: true, bucket: true, logoUrl: true } },
      },
    });
    if (!entry) throw new NotFoundException('Price list entry not found');
    const approvalsMap = await this.fetchApprovals([id]);
    const signatureImages: Record<string, string> = (entry.formData as any)?.signatureImages ?? {};
    const approvals = (approvalsMap[id] ?? []).map(a => ({
      ...a,
      signatureImage: signatureImages[a.role] ?? null,
    }));
    return { ...entry, approvals };
  }

  async signApproval(approvalId: string, userId: string | undefined, signatureData: string) {
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id, price_list_entry_id AS "entryId", role, status
      FROM price_list_approvals WHERE id = ${approvalId}
    `;
    if (!rows.length) throw new NotFoundException('Approval not found');
    const approval = rows[0];

    await this.prisma.$executeRawUnsafe(
      `UPDATE price_list_approvals SET status='approved', user_id=$1, signed_at=NOW(), updated_at=NOW() WHERE id=$2`,
      userId ?? null, approvalId,
    );

    const entry = await this.prisma.priceListEntry.findUnique({ where: { id: approval.entryId } });
    if (entry) {
      const fd = (entry.formData as any) ?? {};
      const sigs: Record<string, string> = fd.signatureImages ?? {};
      sigs[approval.role] = signatureData;
      await this.prisma.priceListEntry.update({
        where: { id: approval.entryId },
        data: { formData: { ...fd, signatureImages: sigs } as any },
      });
    }

    return { success: true };
  }

  async signEntryRole(entryId: string, role: string, userId: string | undefined, signatureData: string) {
    const entry = await this.prisma.priceListEntry.findUnique({ where: { id: entryId } });
    if (!entry) throw new NotFoundException('Entry not found');

    // Find or create the approval row
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT id FROM price_list_approvals
      WHERE price_list_entry_id = ${entryId} AND role = ${role}
      LIMIT 1
    `;

    if (rows.length > 0) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE price_list_approvals SET status='approved', user_id=$1, signed_at=NOW(), updated_at=NOW() WHERE id=$2`,
        userId ?? null, rows[0].id,
      );
    } else {
      const id = randomUUID();
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO price_list_approvals(id, price_list_entry_id, role, user_id, status, signed_at, created_at, updated_at)
         VALUES($1,$2,$3,$4,'approved',NOW(),NOW(),NOW())`,
        id, entryId, role, userId ?? null,
      );
    }

    // Store signature image in formData
    const fd = (entry.formData as any) ?? {};
    const sigs: Record<string, string> = fd.signatureImages ?? {};
    sigs[role] = signatureData;
    await this.prisma.priceListEntry.update({
      where: { id: entryId },
      data: { formData: { ...fd, signatureImages: sigs } as any },
    });

    return { success: true };
  }

  async createEntry(data: { projectId: string; type: string; formData: any; createdByUserId?: string }) {
    return this.prisma.priceListEntry.create({
      data: { projectId: data.projectId, type: data.type, formData: data.formData ?? {}, createdByUserId: data.createdByUserId },
    });
  }

  async updateEntry(id: string, data: { formData: any }) {
    const entry = await this.prisma.priceListEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Price list entry not found');
    return this.prisma.priceListEntry.update({ where: { id }, data: { formData: data.formData } });
  }

  async deleteEntry(id: string) {
    const entry = await this.prisma.priceListEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('Price list entry not found');
    await this.prisma.priceListEntry.delete({ where: { id } });
    return { success: true };
  }

  // ── Approvals ─────────────────────────────────────────────────────────

  async getPendingApprovals(userId: string) {
    // Get user's role name
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });
    if (!user) return [];
    const mappedRole = normaliseRole(user.role?.name ?? '');
    if (!mappedRole) return [];

    const approvals = await this.prisma.$queryRaw<any[]>`
      SELECT
        pla.id AS approval_id,
        pla.status,
        pla.price_list_entry_id,
        ple.type,
        ple.form_data,
        ple.version,
        ple.created_at AS entry_created_at,
        p.id AS project_id,
        p."projectNo",
        p.address,
        p."clientName",
        u.name AS created_by_name
      FROM price_list_approvals pla
      JOIN price_list_entries ple ON ple.id = pla.price_list_entry_id
      JOIN projects p ON p.id = ple."projectId"
      LEFT JOIN users u ON u.id = ple."createdByUserId"
      WHERE pla.role = ${mappedRole}
        AND pla.status = 'pending'
      ORDER BY ple.created_at DESC
    `;

    return approvals.map((row: any) => {
      const fd = this.normaliseFormData(row.form_data ?? {});
      const typeLabel = fd.typeBlocks?.[0]?.typeLabel ?? '';
      return {
        approvalId: row.approval_id,
        priceListEntryId: row.price_list_entry_id,
        type: row.type,
        typeLabel,
        projectId: row.project_id,
        projectNo: row.projectNo,
        address: row.address,
        clientName: row.clientName,
        createdByName: row.created_by_name,
        entryCreatedAt: row.entry_created_at,
        version: row.version,
      };
    });
  }

  async approveApproval(approvalId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.$executeRawUnsafe(
      `UPDATE price_list_approvals
       SET status='approved', user_id=$1, signed_at=NOW(), updated_at=NOW()
       WHERE id=$2`,
      userId, approvalId,
    );

    // Check if all approvals for this entry are done
    const rows = await this.prisma.$queryRaw<any[]>`
      SELECT pla.id, pla.status, ple."projectId", ple.type, ple.form_data, ple.id AS entry_id
      FROM price_list_approvals pla
      JOIN price_list_entries ple ON ple.id = pla.price_list_entry_id
      WHERE pla.price_list_entry_id = (
        SELECT price_list_entry_id FROM price_list_approvals WHERE id=${approvalId}
      )
    `;

    const allApproved = rows.every((r: any) => r.status === 'approved' || r.id === approvalId);
    if (allApproved && rows.length > 0) {
      // Regenerate and re-upload PDF with all signatures
      const entryId = rows[0].entry_id;
      const projectId = rows[0].projectId;
      try {
        await this.regenerateFullPdf(entryId, projectId);
      } catch (err: any) {
        console.error('Full PDF regen failed:', err?.message);
      }
    }

    return { success: true };
  }

  async rejectApproval(approvalId: string, userId: string, note?: string) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE price_list_approvals
       SET status='rejected', user_id=$1, note=$2, signed_at=NOW(), updated_at=NOW()
       WHERE id=$3`,
      userId, note ?? null, approvalId,
    );
    return { success: true };
  }

  private async regenerateFullPdf(entryId: string, projectId: string) {
    const entry = await this.prisma.priceListEntry.findUnique({
      where: { id: entryId },
      include: {
        project: { select: { id: true, projectNo: true, name: true, address: true, bucket: true, dropboxPath: true, dropboxSection: true, dropboxRegion: true, dropboxStatus: true, dropboxClientType: true, clientName: true, logoUrl: true } },
      },
    });
    if (!entry) return;

    const form = this.normaliseFormData(entry.formData);
    const approvalsRaw = await this.prisma.$queryRaw<any[]>`
      SELECT pla.role, pla.status, pla.signed_at AS "signedAt", u.name AS user_name
      FROM price_list_approvals pla
      LEFT JOIN users u ON u.id = pla.user_id
      WHERE pla.price_list_entry_id = ${entryId}
    `;
    const approvalsMap: Record<string, any> = {};
    for (const a of approvalsRaw) {
      approvalsMap[a.role] = a;
    }

    const html = this.buildPdfHtml(form, entry.project, entry.type, approvalsMap);
    const pdfBuffer = await this.renderPdf(html);

    const project = entry.project;
    let basePath = project.dropboxPath ?? '';
    if (!basePath && project.dropboxSection && project.dropboxRegion) {
      const clientTypeFolder = project.dropboxClientType === 'Individuals' ? 'Individiuals' : (project.dropboxClientType ?? 'Clients');
      const parts = ['/D-Projects/T LINES', project.dropboxSection, project.dropboxRegion, project.dropboxStatus ?? '', clientTypeFolder];
      if (project.dropboxClientType === 'Clients' && project.clientName) parts.push(project.clientName);
      parts.push(`${project.projectNo} - ${project.address}`);
      basePath = parts.join('/');
    }
    if (!basePath) return;

    const typeBasePath = `${basePath}/3-Production & Delivery/${entry.type}`;
    const versionNumber = entry.version ?? 1;
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
    const safeType = entry.type.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `${project.projectNo}-${safeType}-ItemList-V${versionNumber}-${dateStr}-FINAL.pdf`;
    const uploadPath = `${typeBasePath}/V${versionNumber}/3-Item List/PDF/${fileName}`;
    await this.dropboxService.uploadBuffer(uploadPath, pdfBuffer);
  }

  // ── Save & Generate ───────────────────────────────────────────────────

  async saveAndGenerate(data: {
    projectId: string;
    type: string;
    formData: any;
    entryId?: string;
    createdByUserId?: string;
    mode?: 'new_version' | 'same_version';
  }) {
    const form = this.normaliseFormData(data.formData);

    // 1. Save or update entry
    let entry: any;
    if (data.entryId) {
      const existing = await this.prisma.priceListEntry.findUnique({ where: { id: data.entryId } });
      if (!existing) throw new NotFoundException('Entry not found');
      entry = await this.prisma.priceListEntry.update({
        where: { id: data.entryId },
        data: { formData: form as any },
      });
    } else {
      entry = await this.prisma.priceListEntry.create({
        data: { projectId: data.projectId, type: data.type, formData: form as any, createdByUserId: data.createdByUserId },
      });
    }

    // 2. Extract and save lookups (iterate typeBlocks)
    const lookupBatch: Array<{ field: string; value: string }> = [];
    const exactLookups: Array<{ field: string; value: string; html?: string }> = [];

    for (const block of form.typeBlocks ?? []) {
      if (block.typeLabel?.trim()) lookupBatch.push({ field: 'type_label', value: block.typeLabel.trim() });
      for (const cat of block.categories ?? []) {
        if (cat.name?.trim()) lookupBatch.push({ field: 'category', value: cat.name.trim() });
        for (const sub of cat.subCategories ?? []) {
          for (const seg of sub.pathSegments ?? []) {
            if (seg?.trim()) lookupBatch.push({ field: 'subcategory_part', value: seg.trim() });
          }
          for (const grp of sub.groups ?? []) {
            if (grp.label?.trim()) lookupBatch.push({ field: 'group_label', value: grp.label.trim() });
            for (const item of grp.items ?? []) {
              const code = item.itemCode?.trim();
              if (code) {
                lookupBatch.push({ field: 'item_code', value: code });
                const descPlain = this.stripHtml(item.description ?? '').trim();
                if (descPlain) exactLookups.push({ field: `item_desc:${code}`, value: descPlain });
                // FIX 4E: store formatted HTML description
                if (item.description?.trim()) {
                  exactLookups.push({ field: `item_desc_fmt:${code}`, value: item.description.trim() });
                }
                const amt = String(item.amount ?? '').trim();
                if (amt) exactLookups.push({ field: `item_amount:${code}`, value: amt });
              }
              if (String(item.taking ?? '').trim())
                lookupBatch.push({ field: 'taking', value: String(item.taking).trim() });
            }
          }
        }
      }
    }

    await this.batchUpsertLookups(lookupBatch);
    for (const el of exactLookups) {
      await this.setExactLookup(el.field, el.value);
    }

    // 3. Resolve Dropbox base path
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
      select: {
        id: true, projectNo: true, name: true, address: true, bucket: true,
        dropboxPath: true, dropboxSection: true, dropboxRegion: true,
        dropboxStatus: true, dropboxClientType: true, clientName: true, logoUrl: true,
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    let basePath: string;
    if (project.dropboxPath) {
      basePath = project.dropboxPath;
    } else if (project.dropboxSection && project.dropboxRegion && project.dropboxStatus && project.dropboxClientType) {
      const clientTypeFolder = project.dropboxClientType === 'Individuals' ? 'Individiuals' : project.dropboxClientType;
      const isClients = project.dropboxClientType === 'Clients';
      const projectFolderName = `${project.projectNo} - ${project.address}`;
      const parts = ['/D-Projects/T LINES', project.dropboxSection, project.dropboxRegion, project.dropboxStatus, clientTypeFolder];
      if (isClients && project.clientName) parts.push(project.clientName);
      parts.push(projectFolderName);
      basePath = parts.join('/');
    } else {
      throw new BadRequestException(
        'Project is missing Dropbox folder info. Please edit the project and set section/region/status/client type before generating PDFs.',
      );
    }

    // 4. FIX 5: Create/update approval records
    const creatorRoleName = data.createdByUserId
      ? await this.prisma.user.findUnique({
          where: { id: data.createdByUserId },
          include: { role: true },
        }).then(u => u?.role?.name ?? '')
      : '';
    const creatorMappedRole = normaliseRole(creatorRoleName);

    if (!data.entryId) {
      // New entry: create 5 pending approval rows
      for (const role of APPROVAL_ROLES) {
        const id = randomUUID();
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO price_list_approvals(id, price_list_entry_id, role, user_id, status, signed_at, created_at, updated_at)
           VALUES($1,$2,$3,$4,$5,$6,NOW(),NOW())`,
          id, entry.id, role,
          role === creatorMappedRole ? data.createdByUserId : null,
          role === creatorMappedRole ? 'approved' : 'pending',
          role === creatorMappedRole ? new Date() : null,
        );
      }
    } else {
      // Update: if creator role approval not yet recorded, mark approved
      if (creatorMappedRole && data.createdByUserId) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE price_list_approvals
           SET status='approved', user_id=$1, signed_at=NOW(), updated_at=NOW()
           WHERE price_list_entry_id=$2 AND role=$3 AND status='pending'`,
          data.createdByUserId, entry.id, creatorMappedRole,
        );
      }
    }

    // Mark any roles approved locally (via approvedRoles map in formData)
    const approvedRoles: Record<string, string> = (form as any).approvedRoles ?? {};
    for (const [approvedRole, approvedByName] of Object.entries(approvedRoles)) {
      // Find user id by name if possible, fall back to createdByUserId
      const userRow = await this.prisma.user.findFirst({ where: { name: approvedByName } }).catch(() => null);
      const uid = userRow?.id ?? data.createdByUserId ?? null;
      const existing = await this.prisma.$queryRaw<any[]>`
        SELECT id FROM price_list_approvals WHERE price_list_entry_id=${entry.id} AND role=${approvedRole} LIMIT 1
      `;
      if (existing.length > 0) {
        await this.prisma.$executeRawUnsafe(
          `UPDATE price_list_approvals SET status='approved', user_id=COALESCE(user_id,$1), signed_at=COALESCE(signed_at,NOW()), updated_at=NOW()
           WHERE price_list_entry_id=$2 AND role=$3`,
          uid, entry.id, approvedRole,
        );
      } else {
        const newId = randomUUID();
        await this.prisma.$executeRawUnsafe(
          `INSERT INTO price_list_approvals(id,price_list_entry_id,role,user_id,status,signed_at,created_at,updated_at)
           VALUES($1,$2,$3,$4,'approved',NOW(),NOW(),NOW())`,
          newId, entry.id, approvedRole, uid,
        );
      }
    }

    // Fetch approvals for PDF rendering
    const approvalsRaw = await this.prisma.$queryRaw<any[]>`
      SELECT pla.role, pla.status, pla.signed_at, u.name AS user_name
      FROM price_list_approvals pla
      LEFT JOIN users u ON u.id = pla.user_id
      WHERE pla.price_list_entry_id = ${entry.id}
    `;
    const approvalsMap: Record<string, any> = {};
    for (const a of approvalsRaw) {
      approvalsMap[a.role] = a;
    }

    // 5. Generate PDF
    let dropboxPath: string | null = null;
    let versionNumber: number | null = null;
    try {
      const html = this.buildPdfHtml(form, project, data.type, approvalsMap);
      const typeBasePath = `${basePath}/3-Production & Delivery/${data.type}`;

      const [pdfBuffer, existingFolders] = await Promise.all([
        this.renderPdf(html),
        this.dropboxService.listFolders(typeBasePath).catch(() => [] as { name: string; path: string }[]),
      ]);
      const vNums = existingFolders
        .map(f => /^V(\d+)$/i.exec(f.name))
        .filter(Boolean)
        .map(m => parseInt(m![1], 10));

      const isSameVersion = data.mode === 'same_version' && vNums.length > 0;
      versionNumber = isSameVersion ? Math.max(...vNums) : (vNums.length > 0 ? Math.max(...vNums) + 1 : 1);

      const versionPath = `${typeBasePath}/V${versionNumber}`;
      if (!isSameVersion) {
        const FORM_SUBFOLDERS = ['1-Proposal', '2-Item Plan', '3-Item List', '4-Book', '5-Purchase Order', '6-Production Form'];
        const batchPaths = [versionPath];
        for (const sub of FORM_SUBFOLDERS) {
          batchPaths.push(`${versionPath}/${sub}`);
          batchPaths.push(`${versionPath}/${sub}/PDF`);
        }
        await this.dropboxService.createFolderBatch(batchPaths);
      }

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const dateStr = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
      const safeType = data.type.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `${project.projectNo}-${safeType}-ItemList-V${versionNumber}-${dateStr}.pdf`;
      const uploadPath = `${versionPath}/3-Item List/PDF/${fileName}`;
      dropboxPath = await this.dropboxService.uploadBuffer(uploadPath, pdfBuffer);
    } catch (err: any) {
      console.error('PDF generation/upload failed:', err?.message ?? err);
    }

    if (data.mode !== 'same_version' && versionNumber !== null) {
      await this.prisma.$executeRawUnsafe(`UPDATE price_list_entries SET version=$1 WHERE id=$2`, versionNumber, entry.id).catch(() => {});
    }

    // 6. FIX 7: Sync ProjectItems (per item_code)
    const projectItemsCreated = await this.syncProjectItemsFromForm(form, data.projectId, data.type, entry.id);

    return { entryId: entry.id, dropboxPath, version: versionNumber, projectItemsCreated };
  }

  // ── Sync project items from price list form ─────────────────────────

  private async syncProjectItemsFromForm(form: any, projectId: string, priceListType: string, entryId: string): Promise<number> {
    const defaultItemType = PRICE_LIST_TYPE_MAP[priceListType.toLowerCase()];

    // Pre-fetch vendor codes for all vendorIds so we can detect YSM/GOS
    const allVendorIds = new Set<string>();
    for (const item of this.iterItems(form)) {
      if (item.vendorId) allVendorIds.add(item.vendorId);
    }
    const vendors = await this.prisma.vendor.findMany({
      where: { id: { in: Array.from(allVendorIds) } },
      select: { id: true, code: true },
    }).catch(() => [] as any[]);
    const vendorCodeById = new Map<string, string>();
    for (const v of vendors) vendorCodeById.set(v.id as string, v.code as string);

    // Build itemMap keyed by stable string
    // YSM/GOS + Millwork typeBlock → ONE row per (vendor × typeBlock), keyed by `ysm_gos_{vendorId}_{blockId}`
    // All other items → one row per form item, keyed by itemCode or item.id
    const itemMap = new Map<string, {
      vendorId: string; amount: number; itemType: ProjectItemType; orderType?: string;
    }>();

    for (const block of form.typeBlocks ?? []) {
      const blockType = PRICE_LIST_TYPE_MAP[block.typeLabel?.toLowerCase()] ?? defaultItemType;
      if (!blockType) continue;

      // Determine if this typeBlock qualifies for the M01/M02/M03 fixed system
      const mInfo = blockType === ProjectItemType.MILLWORK
        ? getMillworkTypeInfo(block.typeLabel ?? '')
        : null;

      // Accumulate totals for YSM/GOS vendors within this block
      const ysmGosAmounts = new Map<string, number>(); // vendorId → total amount

      for (const cat of block.categories ?? []) {
        for (const sub of cat.subCategories ?? []) {
          for (const grp of sub.groups ?? []) {
            for (const item of grp.items ?? []) {
              if (!item.vendorId) continue;
              const vendorCode = vendorCodeById.get(item.vendorId) ?? '';
              const qty = parseFloat(String(item.quantity ?? 0)) || 0;
              const amount = qty * (parseFloat(String(item.amount ?? 0)) || 0);

              if (mInfo && YSM_GOS_CODES.has(vendorCode)) {
                // Group: accumulate into one project_item per vendor×block
                ysmGosAmounts.set(item.vendorId, (ysmGosAmounts.get(item.vendorId) ?? 0) + amount);
              } else {
                // Key must be unique per (block × vendor × itemCode) to avoid collisions
                // when the same itemCode is used by different vendors in the same block,
                // or the same itemCode appears in multiple blocks
                const key = `${block.id}_${item.vendorId}_${item.itemCode?.trim() || item.id}`;
                itemMap.set(key, { vendorId: item.vendorId, amount, itemType: blockType });
              }
            }
          }
        }
      }

      // Emit one entry per YSM/GOS vendor in this block
      if (mInfo) {
        for (const [vendorId, totalAmount] of ysmGosAmounts) {
          const key = `ysm_gos_${vendorId}_${block.id}`;
          itemMap.set(key, {
            vendorId,
            amount: totalAmount,
            itemType: ProjectItemType.MILLWORK,
            orderType: mInfo.orderType,
          });
        }
      }
    }

    // Remove stale project_items that are no longer in the form
    const existingFromList = await this.prisma.$queryRaw<any[]>`
      SELECT id, "priceListCode"
      FROM project_items
      WHERE "sourcePriceListId"=${entryId}
        AND "projectId"=${projectId}
        AND "deletedAt" IS NULL
    `.catch(() => [] as any[]);

    for (const row of existingFromList) {
      if (!itemMap.has(row.priceListCode)) {
        await this.prisma.projectItem.delete({ where: { id: row.id } }).catch(() => {});
      }
    }

    // Upsert each item
    let created = 0;
    for (const [key, { vendorId, amount, itemType, orderType }] of itemMap) {
      try {
        const existing = await this.prisma.$queryRaw<any[]>`
          SELECT id FROM project_items
          WHERE "projectId"=${projectId}
            AND "priceListCode"=${key}
            AND "sourcePriceListId"=${entryId}
            AND "deletedAt" IS NULL
          LIMIT 1
        `;
        if (existing.length > 0) {
          await this.prisma.projectItem.update({
            where: { id: existing[0].id },
            data: {
              vendorId,
              pfUsd: amount > 0 ? amount : undefined,
              ...(orderType ? { orderType } : {}),
            },
          });
        } else {
          // For YSM/GOS pass orderType so PF code uses M01/M02/M03 from type
          const pfCode = await this.pfCodeService.generatePfCode(
            projectId, vendorId, { enumType: itemType }, orderType ?? null,
          );
          await this.prisma.projectItem.create({
            data: {
              projectId, vendorId, type: itemType, pfCode,
              pfUsd: amount > 0 ? amount : undefined,
              priceListCode: key, sourcePriceListId: entryId,
              ...(orderType ? { orderType } : {}),
            },
          });
          created++;
        }
      } catch (err: any) {
        console.error(`syncProjectItem failed for key=${key}:`, err?.message);
      }
    }
    return created;
  }

  // ── PDF generation ────────────────────────────────────────────────────

  private escapeHtml(str: string): string {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /** Render description HTML safely — preserves hl-red spans */
  private renderDescHtml(desc: string): string {
    if (!desc) return '';
    // Allow span.hl-red and basic inline tags; strip the rest
    return desc
      .replace(/<span[^>]*class=["']?hl-red["']?[^>]*>/gi, '<span style="color:#d32f2f;font-weight:bold;">')
      .replace(/<\/(span|b|i|strong|em)>/gi, '</$1>')
      .replace(/<(b|i|strong|em)\b[^>]*>/gi, '<$1>')
      .replace(/<br\s*\/?>/gi, '<br>')
      .replace(/<(?!\/?(span|b|i|strong|em|br)\b)[^>]+>/g, '');
  }

  private buildPdfHtml(form: any, project: any, type: string, approvalsMap: Record<string, any> = {}): string {
    const fmtMoney = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const calcTotal = (q: any, a: any) => (parseFloat(String(q ?? 0)) || 0) * (parseFloat(String(a ?? 0)) || 0);
    const esc = (s: any) => this.escapeHtml(String(s ?? ''));
    const bucketLabel = (b: string) => (b ?? '').replace('TLINES_', 'T-Lines ').replace('CVW', 'CVW');

    let grandTotalQty = 0;
    let grandTotalAmt = 0;
    let typeBlocksHtml = '';

    const approvedRolesLocal: Record<string, string> = (form as any).approvedRoles ?? {};
    const sigRoles = ['Production Manager', 'Project Manager', 'Sales & Coordination', 'T Lines Project Manager', 'T Lines General Manager'];
    const renderSigBox = (role: string) => {
      const approval = approvalsMap[role];
      const isApproved = approval?.status === 'approved' || !!approvedRolesLocal[role];
      const userName = approval?.user_name ?? approvedRolesLocal[role] ?? '';
      return `<div style="flex:1;min-width:120px;margin:3px;">
        <div style="border:1px solid ${isApproved ? '#bbf7d0' : '#cbd5e0'};border-radius:4px;padding:7px 8px;background:${isApproved ? '#f0fdf4' : 'white'};text-align:center;">
          <div style="font-size:7px;font-weight:700;color:#64748b;text-align:center;margin-bottom:6px;text-transform:uppercase;">${esc(role)}</div>
          <div style="height:36px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;">
            ${isApproved && userName ? `<span style="font-family:Georgia,serif;font-style:italic;font-size:13px;color:#1e293b;">${esc(userName)}</span>` : ''}
          </div>
          <div style="margin-top:4px;font-size:7px;font-weight:700;color:${isApproved ? '#16a34a' : '#94a3b8'};">
            ${isApproved ? '✓ Approved' : '⏳ Pending'}
          </div>
        </div>
      </div>`;
    };
    const sigBlockHtml = `
      <div style="margin-top:10px;padding:8px 10px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:6px;">
        <div style="font-size:7px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Signatures & Approvals</div>
        <div style="display:flex;gap:6px;margin-bottom:6px;">${sigRoles.slice(0, 3).map(renderSigBox).join('')}</div>
        <div style="display:flex;gap:6px;justify-content:center;">${sigRoles.slice(3).map(r => `<div style="width:38%;">${renderSigBox(r)}</div>`).join('')}</div>
      </div>`;

    for (const block of form.typeBlocks ?? []) {
      // Red type banner
      typeBlocksHtml += `
        <div style="background:#dc2626;color:white;padding:9px 16px;font-weight:bold;text-align:center;
                    text-transform:uppercase;letter-spacing:4px;margin-bottom:8px;font-size:12px;">
          ${esc(block.typeLabel ?? type)}
        </div>`;

      for (const cat of block.categories ?? []) {
        // Category-level totals (all sub-categories combined)
        let catTotalQty = 0, catTotalAmt = 0;
        for (const sub of cat.subCategories ?? []) {
          for (const grp of sub.groups ?? []) {
            for (const item of grp.items ?? []) {
              catTotalQty += parseFloat(String(item.quantity ?? 0)) || 0;
              catTotalAmt += calcTotal(item.quantity, item.amount);
            }
          }
        }
        grandTotalQty += catTotalQty;
        grandTotalAmt += catTotalAmt;

        typeBlocksHtml += `<div style="margin-bottom:8px;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
          <div style="background:#1e293b;color:white;padding:6px 12px;font-weight:bold;font-size:11px;letter-spacing:0.5px;">
            ${esc(cat.name)}
          </div>`;

        for (const sub of cat.subCategories ?? []) {
          const pathStr = (sub.pathSegments ?? []).filter(Boolean).join(' / ');

          typeBlocksHtml += `
            <div style="background:#e2e8f0;color:#475569;padding:4px 12px;font-size:10px;border-bottom:1px solid #cbd5e0;">
              ${esc(pathStr)}
            </div>
            <table style="width:100%;border-collapse:collapse;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="width:22px;border:1px solid #e2e8f0;padding:3px;font-size:9px;"></th>
                  <th style="width:36px;border:1px solid #e2e8f0;padding:3px;font-size:9px;color:#64748b;">Photo</th>
                  <th style="border:1px solid #e2e8f0;padding:4px 6px;font-size:9px;text-align:left;font-weight:600;color:#64748b;">Item Code</th>
                  <th style="border:1px solid #e2e8f0;padding:4px 6px;font-size:9px;text-align:left;font-weight:600;color:#64748b;">Description</th>
                  <th style="border:1px solid #e2e8f0;padding:4px 6px;font-size:9px;text-align:right;font-weight:600;color:#64748b;">Qty</th>
                  <th style="border:1px solid #e2e8f0;padding:4px 6px;font-size:9px;text-align:right;font-weight:600;color:#64748b;">Amount</th>
                  <th style="border:1px solid #e2e8f0;padding:4px 6px;font-size:9px;text-align:right;font-weight:600;color:#64748b;">Total ST</th>
                  <th style="border:1px solid #e2e8f0;padding:4px 6px;font-size:9px;text-align:right;font-weight:600;color:#64748b;">Taking</th>
                  <th style="border:1px solid #e2e8f0;padding:4px 6px;font-size:9px;text-align:left;font-weight:600;color:#64748b;">Vendor</th>
                </tr>
              </thead>
              <tbody>`;

          for (const grp of sub.groups ?? []) {
            const items: any[] = grp.items ?? [];
            if (items.length === 0) continue;
            items.forEach((item: any, idx: number) => {
              const total = calcTotal(item.quantity, item.amount);
              typeBlocksHtml += `<tr>`;
              if (idx === 0) {
                typeBlocksHtml += `<td rowspan="${items.length}" style="background:#f1f5f9;border:1px solid #e2e8f0;width:22px;text-align:center;vertical-align:middle;padding:2px;">
                  <div style="writing-mode:vertical-rl;transform:rotate(180deg);font-size:9px;font-weight:600;color:#475569;white-space:nowrap;max-height:80px;overflow:hidden;">
                    ${esc(grp.label)}
                  </div>
                </td>`;
              }
              typeBlocksHtml += `
                <td style="border:1px solid #e2e8f0;padding:2px;text-align:center;vertical-align:middle;">
                  <div style="width:32px;height:32px;background:#f1f5f9;border:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;margin:auto;">
                    <span style="font-size:14px;color:#94a3b8;">&#9725;</span>
                  </div>
                </td>
                <td style="border:1px solid #e2e8f0;padding:3px 6px;font-size:10px;">${esc(item.itemCode)}</td>
                <td style="border:1px solid #e2e8f0;padding:3px 6px;font-size:10px;">${this.renderDescHtml(item.description)}</td>
                <td style="border:1px solid #e2e8f0;padding:3px 6px;font-size:10px;text-align:right;">${esc(item.quantity)}</td>
                <td style="border:1px solid #e2e8f0;padding:3px 6px;font-size:10px;text-align:right;">${esc(item.amount)}</td>
                <td style="border:1px solid #e2e8f0;padding:3px 6px;font-size:10px;text-align:right;font-weight:600;">$${fmtMoney(total)}</td>
                <td style="border:1px solid #e2e8f0;padding:3px 6px;font-size:10px;text-align:right;">${esc(item.taking)}</td>
                <td style="border:1px solid #e2e8f0;padding:3px 6px;font-size:10px;">${esc(item.vendor)}</td>
              </tr>`;
            });
          }
          typeBlocksHtml += `</tbody></table>`;
        }

        // ONE gold total per category (all sub-categories combined)
        typeBlocksHtml += `
          <table style="width:100%;border-collapse:collapse;">
            <tr style="background:#f5a623;">
              <td colspan="4" style="border:1px solid #e2e8f0;padding:5px 10px;font-size:10px;font-weight:700;color:#fff;">TOTAL</td>
              <td style="border:1px solid #e2e8f0;padding:5px 6px;font-size:10px;font-weight:700;color:#fff;text-align:right;">${Math.round(catTotalQty)}</td>
              <td style="border:1px solid #e2e8f0;padding:5px 6px;font-size:10px;"></td>
              <td style="border:1px solid #e2e8f0;padding:5px 6px;font-size:10px;font-weight:700;color:#fff;text-align:right;">$${fmtMoney(catTotalAmt)}</td>
              <td colspan="2" style="border:1px solid #e2e8f0;"></td>
            </tr>
          </table>
        </div>`;
      }
      // Signature block after each type section
      typeBlocksHtml += sigBlockHtml;
    }

    const headerTo = form.header?.to ?? bucketLabel(project.bucket);
    const headerDate = form.header?.date ?? '';
    const headerName = form.header?.projectName ?? project.address;
    const headerNo = form.header?.projectNumber ?? project.projectNo;

    // Logo: prefer instance-level embedded base64 (loaded in constructor from logo.png)
    const logoSrc = this.logoB64 || '';
    const logoHtml = logoSrc
      ? `<img src="${logoSrc}" style="max-width:130px;max-height:55px;object-fit:contain;" />`
      : `<div style="font-size:18px;font-weight:900;color:#1e293b;letter-spacing:3px;line-height:1;">TRUSlines</div>
         <div style="font-size:8px;color:#64748b;letter-spacing:2px;margin-top:2px;">CONSTRUCTION</div>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Item Price List — ${esc(headerNo)}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 10px; margin: 0; padding: 12px; color: #1e293b; }
    .hl-red { color: #d32f2f; font-weight: bold; }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="display:flex;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;margin-bottom:0;">
    <div style="width:150px;flex-shrink:0;border-right:1px solid #e2e8f0;display:flex;align-items:center;justify-content:center;padding:10px 14px;">
      ${logoHtml}
    </div>
    <div style="flex:1;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;justify-content:center;padding:8px 0;border-bottom:1px solid #e2e8f0;">
        <span style="font-size:13px;font-weight:700;letter-spacing:3px;color:#1e293b;text-transform:uppercase;">ITEM PRICE LIST</span>
      </div>
      <div style="background:#4a4a4a;display:flex;align-items:center;justify-content:center;padding:6px 0;">
        <span style="font-size:12px;font-weight:700;letter-spacing:4px;color:white;text-transform:uppercase;">${esc(type)}</span>
      </div>
    </div>
  </div>

  <!-- Project info row -->
  <div style="display:grid;grid-template-columns:1fr 2fr 1fr 1fr;border:1px solid #e2e8f0;border-top:none;margin-bottom:10px;">
    ${[['TO', headerTo], ['PROJECT NAME', headerName], ['PROJECT NUMBER', headerNo], ['DATE', headerDate]].map(([lbl, val], i) =>
      `<div style="border-left:${i > 0 ? '1px solid #e2e8f0' : 'none'};padding:6px 10px;">
         <div style="font-size:8px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px;">${lbl}</div>
         <div style="font-size:${lbl === 'PROJECT NUMBER' ? 14 : 11}px;font-weight:${lbl === 'PROJECT NUMBER' ? 700 : 400};color:#1e293b;">${esc(val)}</div>
       </div>`).join('')}
  </div>

  ${typeBlocksHtml}

  <!-- FIX 6C: Grand total red bar -->
  <div style="background:#d32f2f;color:white;padding:9px 14px;display:flex;justify-content:space-between;font-weight:bold;font-size:12px;margin-top:10px;margin-bottom:14px;border-radius:4px;">
    <span>GRAND TOTAL</span>
    <span style="display:flex;gap:32px;">
      <span>${Math.round(grandTotalQty)} units</span>
      <span>$${fmtMoney(grandTotalAmt)}</span>
    </span>
  </div>


</body>
</html>`;
  }

  /**
   * On Vercel there is no bundled Chrome: use puppeteer-core with the
   * serverless Chromium build. Locally fall back to full puppeteer.
   */
  private async launchBrowser(): Promise<any> {
    /* eslint-disable @typescript-eslint/no-var-requires */
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      const chromium = require('@sparticuz/chromium');
      const puppeteerCore = require('puppeteer-core');
      return puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    }
    const puppeteer = require('puppeteer');
    return puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    /* eslint-enable @typescript-eslint/no-var-requires */
  }

  private async renderPdf(html: string): Promise<Buffer> {
    const browser = await this.launchBrowser();
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' } });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
