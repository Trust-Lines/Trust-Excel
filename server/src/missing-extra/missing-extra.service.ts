import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { applyStatusDateAutomation } from '../common/helpers/status-date-automation';
import { CreateMissingExtraCaseDto } from './dto/create-case.dto';
import { UpdateMissingExtraCaseDto } from './dto/update-case.dto';
import { CreateMissingExtraItemDto } from './dto/create-item.dto';
import { UpdateMissingExtraItemDto } from './dto/update-item.dto';
import {
  MissingExtraCaseResponse,
  MissingExtraItemResponse,
  GroupedMissingExtraCasesResponse
} from './dto/response.dto';
import { PfCodeGenerationService } from '../projects/services/pf-code-generation.service';
import { ProjectBucket, CaseType, MissingExtraCase, MissingExtraItem, Prisma } from '@prisma/client';
import { AccessControlService, PermissionDecision } from '../permissions/services/access-control.service';
import { TypeVisibilityService } from '../permissions/services/type-visibility.service';
import { ProjectScopeService } from '../permissions/services/project-scope.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SupplierTotalsService } from '../supplier-totals/supplier-totals.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class MissingExtraService {
  constructor(
    private prismaService: PrismaService,
    private pfCodeGenerationService: PfCodeGenerationService,
    private accessControlService: AccessControlService,
    private auditLogService: AuditLogService,
    private typeVisibilityService: TypeVisibilityService,
    private projectScopeService: ProjectScopeService,
    private supplierTotalsService: SupplierTotalsService,
    private eventsGateway: EventsGateway,
  ) { }

  /**
   * Get all cases grouped by section with V2 column filtering
   */
  async findAllCases(user?: any): Promise<GroupedMissingExtraCasesResponse> {
    try {
      // Type filter removed - frontend handles restricted types with blur display

      // Project scope filter: check both main project IDs and missingExtra-specific IDs
      let caseWhere: any = { deletedAt: null };
      if (user?.roleId) {
        const mainIds = await this.projectScopeService.getAssignedProjectIds(user.roleId);
        if (mainIds !== null) {
          const meIds = await this.projectScopeService.getAssignedIdsBySource(user.roleId, 'missingExtra');
          const conditions: any[] = [];
          if (mainIds.length > 0) conditions.push({ baseProjectId: { in: mainIds } });
          if (meIds && meIds.length > 0) conditions.push({ id: { in: meIds } });
          if (conditions.length > 0) {
            caseWhere.OR = conditions;
          } else {
            // Scope enabled but nothing assigned → show nothing
            caseWhere.id = { in: [] };
          }
        }
      }

      const cases = await this.prismaService.missingExtraCase.findMany({
        where: Object.keys(caseWhere).length > 0 ? caseWhere : undefined,
        include: {
          baseProject: {
            select: {
              id: true,
              projectNo: true,
              name: true,
            },
          },
          items: {
            where: { deletedAt: null },
            include: {
              vendor: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
              customType: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });


      // ✅ V2 COLUMN FILTERING: Apply permission-based filtering to items
      let filteredCases = cases;
      if (user?.id) {
        const startTime = Date.now();
        const isV2Enabled = this.accessControlService.isV2Enabled('supplier-me-sheet', user.id);

        if (isV2Enabled) {
          // Get visible columns for this user
          const visibleColumns = await this.accessControlService.getSupplierMeVisibleColumns(user.id);

          // Apply filtering to all items in all cases
          filteredCases = cases.map(caseItem => ({
            ...caseItem,
            items: caseItem.items.map(item => this.filterItemByVisibleColumns(item, visibleColumns))
          }));
        }
      }

      // Group by section
      const grouped: GroupedMissingExtraCasesResponse = {
        TLINES_NE: [],
        TLINES_SE: [],
        TLINES_NW: [],
        CVW: [],
        TLINES_HQ: [],
        TLINES_TC: [],
      };

      filteredCases.forEach((caseItem) => {
        grouped[caseItem.section].push(this.formatCaseResponse(caseItem));
      });

      return grouped;
    } catch (error) {
      console.error('❌ [MISSING_EXTRA_CASES_500]', {
        error: error.message,
        stack: error.stack,
        prismaError: error,
        queryDetails: {
          model: 'missingExtraCase',
          operation: 'findMany',
          include: {
            baseProject: true,
            items: { include: { vendor: true } }
          }
        }
      });

      // Return empty grouped response to prevent frontend crash
      return {
        TLINES_NE: [],
        TLINES_SE: [],
        TLINES_NW: [],
        CVW: [],
        TLINES_HQ: [],
        TLINES_TC: [],
      };
    }
  }

  /**
   * Create a new case
   */
  async createCase(createCaseDto: CreateMissingExtraCaseDto, userId?: string): Promise<MissingExtraCaseResponse> {
    let baseProjectNo: string;
    let baseProjectName: string;
    let baseProjectId: string | null = null;

    // Validate input mode and resolve project data
    if (createCaseDto.baseProjectId) {
      // Mode 1: From existing project - lookup the project
      const existingProject = await this.prismaService.project.findUnique({
        where: { id: createCaseDto.baseProjectId },
        select: {
          id: true,
          projectNo: true,
          name: true,
          bucket: true,
        },
      });

      if (!existingProject) {
        throw new Error(`Project with ID ${createCaseDto.baseProjectId} not found`);
      }

      // Use projectNo directly as string (no more "P" prefix extraction)
      baseProjectNo = existingProject.projectNo;
      baseProjectName = existingProject.name;
      baseProjectId = existingProject.id;
    } else if (createCaseDto.legacyProjectNo && createCaseDto.legacyProjectName) {
      // Mode 2: Legacy/manual project - string as-is
      baseProjectNo = createCaseDto.legacyProjectNo;
      baseProjectName = createCaseDto.legacyProjectName;
      baseProjectId = null;
    } else {
      throw new Error('Either baseProjectId or both legacyProjectNo and legacyProjectName must be provided');
    }

    // Determine the case index
    let caseIndex: number;

    if (createCaseDto.caseIndex != null) {
      // Custom case index provided - check for duplicates (only among active, non-deleted cases)
      const duplicate = await this.prismaService.missingExtraCase.findFirst({
        where: {
          baseProjectNo,
          caseType: createCaseDto.caseType,
          caseIndex: createCaseDto.caseIndex,
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new BadRequestException(
          `Case index ${createCaseDto.caseIndex} already exists for project ${baseProjectNo} with type ${createCaseDto.caseType}`
        );
      }

      caseIndex = createCaseDto.caseIndex;
    } else {
      // Auto-increment: find highest existing index (only among active, non-deleted cases)
      const existingCases = await this.prismaService.missingExtraCase.findMany({
        where: {
          baseProjectNo,
          caseType: createCaseDto.caseType,
          deletedAt: null,
        },
        orderBy: {
          caseIndex: 'desc',
        },
        take: 1,
      });

      caseIndex = existingCases.length > 0 ? existingCases[0].caseIndex + 1 : 1;
    }

    // Generate derived project code with correct format
    const derivedProjectCode = this.generateDerivedProjectCode(
      baseProjectNo,
      createCaseDto.caseType,
      caseIndex
    );

    // Check derivedProjectCode uniqueness (only among active, non-deleted cases)
    const existingCode = await this.prismaService.missingExtraCase.findFirst({
      where: { derivedProjectCode, deletedAt: null },
    });
    if (existingCode) {
      throw new BadRequestException(`Derived project code "${derivedProjectCode}" already exists`);
    }

    // Create the case with resolved data
    const createdCase = await this.prismaService.missingExtraCase.create({
      data: {
        baseProjectId,
        baseProjectNo,
        baseProjectName,
        section: createCaseDto.section,
        caseType: createCaseDto.caseType,
        caseIndex,
        derivedProjectCode,
        types: createCaseDto.types, // Store selected types
      },
      include: {
        baseProject: {
          select: {
            id: true,
            projectNo: true,
            name: true,
          },
        },
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Auto-create placeholder items for selected types
    for (const type of createCaseDto.types) {
      try {
        await this.prismaService.missingExtraItem.create({
          data: {
            caseId: createdCase.id,
            type: type as any,
            pfUsd: 0,
            pfTl: 0,
          },
        });
      } catch (error) {
        console.error(`Failed to create placeholder item for type ${type}:`, error);
        // Continue with other types even if one fails
      }
    }

    // Re-fetch the case with items to return complete data
    const caseWithItems = await this.findCaseById(createdCase.id);

    // AUDIT LOG: Case creation
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      this.auditLogService.log({
        domain: 'MISSING_EXTRA',
        entityId: createdCase.id,
        entityType: 'MissingExtraCase',
        projectRef: derivedProjectCode,
        field: 'case',
        oldValue: null,
        newValue: `Created: ${createCaseDto.caseType} case for ${baseProjectName}`,
        action: 'CREATE',
        userId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(() => { });
    }

    this.eventsGateway.emitToRooms(['missing-extra', 'suppliers', 'dashboard'], 'me-case:created', { case: caseWithItems }, userId);
    return caseWithItems;
  }

  /**
   * Get case by ID
   */
  async findCaseById(id: string): Promise<MissingExtraCaseResponse> {
    const caseItem = await this.prismaService.missingExtraCase.findUnique({
      where: { id },
      include: {
        baseProject: {
          select: {
            id: true,
            projectNo: true,
            name: true,
          },
        },
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!caseItem) {
      throw new NotFoundException('Missing & Extra case not found');
    }

    return this.formatCaseResponse(caseItem);
  }

  /**
   * Update case by ID
   */
  async updateCase(id: string, updateCaseDto: UpdateMissingExtraCaseDto, userId?: string): Promise<MissingExtraCaseResponse> {
    // First check if case exists
    const existingCase = await this.prismaService.missingExtraCase.findUnique({
      where: { id },
    });

    if (!existingCase) {
      throw new NotFoundException('Missing & Extra case not found');
    }

    // Prepare update data
    const updateData: any = { ...updateCaseDto };

    // Convert containerDate string to Date object if provided
    if (updateCaseDto.containerDate) {
      updateData.containerDate = new Date(updateCaseDto.containerDate);
    }

    // Update the case
    const updatedCase = await this.prismaService.missingExtraCase.update({
      where: { id },
      data: updateData,
      include: {
        baseProject: {
          select: {
            id: true,
            projectNo: true,
            name: true,
          },
        },
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // AUDIT LOG: Case update
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      const auditEntries: Array<any> = [];
      const fieldsToTrack = ['containerNo', 'containerDate', 'section', 'caseType'];
      for (const field of fieldsToTrack) {
        const newVal = (updateCaseDto as any)[field];
        if (newVal === undefined) continue;
        const oldVal = (existingCase as any)[field];
        const fmt = (v: any) => v?.toISOString?.() || v?.toString?.() || null;
        if (fmt(oldVal) !== fmt(newVal)) {
          auditEntries.push({
            domain: 'MISSING_EXTRA',
            entityId: id,
            entityType: 'MissingExtraCase',
            projectRef: existingCase.derivedProjectCode,
            field,
            oldValue: fmt(oldVal),
            newValue: fmt(newVal),
            userId,
            userName: userInfo?.name,
            userRole: userInfo?.role,
          });
        }
      }
      if (auditEntries.length > 0) {
        this.auditLogService.logBatch(auditEntries).catch(() => { });
      }
    }

    const result = this.formatCaseResponse(updatedCase);
    this.eventsGateway.emitToRooms(['missing-extra', 'suppliers', 'dashboard'], 'me-case:updated', { case: result }, userId);
    return result;
  }

  async bulkAssignHalf(
    dto: { caseIds: string[]; halfOfYear?: string | null; halfYear?: number | null },
    userId?: string,
  ): Promise<{ updatedCount: number }> {
    if (!dto.caseIds || dto.caseIds.length === 0) {
      throw new BadRequestException('caseIds is required and must not be empty');
    }

    const { count } = await this.prismaService.missingExtraCase.updateMany({
      where: { id: { in: dto.caseIds } },
      data: {
        halfOfYear: (dto.halfOfYear ?? null) as any,
        halfYear: dto.halfYear ?? null,
      },
    });

    // No excludeUserId: this action is meant to be seen cross-page in the same
    // session too (Missing & Extra → Suppliers), not just by other users.
    this.eventsGateway.emitToRooms(['missing-extra', 'suppliers', 'dashboard'], 'me-case:updated', { caseIds: dto.caseIds });

    return { updatedCount: count };
  }

  /**
   * Get items for a specific case with V2 column filtering
   */
  async findItemsByCase(caseId: string, user?: any): Promise<MissingExtraItemResponse[]> {
    const itemWhere: any = { caseId };

    const items = await this.prismaService.missingExtraItem.findMany({
      where: itemWhere,
      include: {
        vendor: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        customType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // ✅ V2 COLUMN FILTERING: Apply permission-based filtering
    let filteredItems = items;
    if (user?.id) {
      const startTime = Date.now();
      const isV2Enabled = this.accessControlService.isV2Enabled('supplier-me-sheet', user.id);

      if (isV2Enabled) {
        // Get visible columns for this user
        const visibleColumns = await this.accessControlService.getSupplierMeVisibleColumns(user.id);

        // Apply filtering to all items
        filteredItems = items.map(item => this.filterItemByVisibleColumns(item, visibleColumns));
      }
    }

    return filteredItems.map((item) => this.formatItemResponse(item));
  }

  /**
   * Create a new item for a case
   */
  async createItem(caseId: string, createItemDto: CreateMissingExtraItemDto, userId?: string): Promise<MissingExtraItemResponse> {
    // Verify case exists
    const caseItem = await this.findCaseById(caseId);

    const initialStatus = createItemDto.status ?? 'NOT_ORDERED';
    const createdItem = await this.prismaService.missingExtraItem.create({
      data: {
        ...createItemDto,
        status: initialStatus,
        pfSignStatus: createItemDto.pfSignStatus ?? 'NOT_SIGNED',
        poSignStatus: createItemDto.poSignStatus ?? 'NOT_SIGNED',
        caseId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        customType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Generate PF code if vendor is assigned
    if (createdItem.vendorId && createdItem.type) {
      try {
        const pfCode = await this.generatePfCodeForItem(caseItem.derivedProjectCode, createdItem.vendorId, createdItem.type, createdItem.orderType);
        await this.prismaService.missingExtraItem.update({
          where: { id: createdItem.id },
          data: { pfCode },
        });
        createdItem.pfCode = pfCode;
      } catch (error) {
        console.error('Failed to generate PF code for missing/extra item:', error);
      }
    }

    // AUDIT LOG: ME item creation
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      this.auditLogService.log({
        domain: 'MISSING_EXTRA',
        entityId: createdItem.id,
        entityType: 'MissingExtraItem',
        projectRef: caseItem.derivedProjectCode,
        field: 'item',
        oldValue: null,
        newValue: `Created: ${createItemDto.type || 'custom'} item`,
        action: 'CREATE',
        userId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(() => { });
    }

    this.supplierTotalsService.invalidateCache();
    const result = this.formatItemResponse(createdItem);
    this.eventsGateway.emitToRooms(['missing-extra', 'suppliers', 'dashboard'], 'me-item:created', { item: result, caseId }, userId);
    return result;
  }

  /**
   * Update an item with the same auto-date rules as Projects
   */
  async updateItem(itemId: string, updateItemDto: UpdateMissingExtraItemDto, userId?: string): Promise<MissingExtraItemResponse> {
    // Get existing item
    const existingItem = await this.prismaService.missingExtraItem.findUnique({
      where: { id: itemId },
      include: { vendor: true, case: true },
    });

    if (!existingItem) {
      throw new NotFoundException('Missing & Extra item not found');
    }

    const result = await this.prismaService.$transaction(async (prisma) => {
      // Prepare update data — strip undefined to prevent Prisma Decimal coercion errors
      const updateData: any = Object.fromEntries(
        Object.entries({ ...updateItemDto }).filter(([, v]) => v !== undefined)
      );

      // Convert date strings to Date objects
      if (updateItemDto.std) updateData.std = new Date(updateItemDto.std);
      if (updateItemDto.etd) updateData.etd = new Date(updateItemDto.etd);
      if (updateItemDto.rtd) updateData.rtd = new Date(updateItemDto.rtd);
      if (updateItemDto.rtr) updateData.rtr = new Date(updateItemDto.rtr);
      if (updateItemDto.ftd) updateData.ftd = new Date(updateItemDto.ftd);
      if (updateItemDto.rdy) updateData.rdy = new Date(updateItemDto.rdy);
      if (updateItemDto.snd) updateData.snd = new Date(updateItemDto.snd);
      if (updateItemDto.containerDate) updateData.containerDate = new Date(updateItemDto.containerDate);

      // Convert paid date fields (nullable)
      if (updateItemDto.paidUsd1Date !== undefined) updateData.paidUsd1Date = updateItemDto.paidUsd1Date ? new Date(updateItemDto.paidUsd1Date) : null;
      if (updateItemDto.paidUsd2Date !== undefined) updateData.paidUsd2Date = updateItemDto.paidUsd2Date ? new Date(updateItemDto.paidUsd2Date) : null;
      if (updateItemDto.paidTl1Date !== undefined) updateData.paidTl1Date = updateItemDto.paidTl1Date ? new Date(updateItemDto.paidTl1Date) : null;
      if (updateItemDto.paidTl2Date !== undefined) updateData.paidTl2Date = updateItemDto.paidTl2Date ? new Date(updateItemDto.paidTl2Date) : null;
      if (updateItemDto.invoiceDate !== undefined) updateData.invoiceDate = updateItemDto.invoiceDate ? new Date(updateItemDto.invoiceDate) : null;
      if (updateItemDto.priceNotes !== undefined) updateData.priceNotes = updateItemDto.priceNotes;

      // Convert numeric values to Decimal
      if (updateItemDto.pfUsd !== undefined) {
        updateData.pfUsd = updateItemDto.pfUsd;
      }
      if (updateItemDto.pfTl !== undefined) {
        updateData.pfTl = updateItemDto.pfTl;
      }

      // 💰 PAID AMOUNT FIELDS - CRITICAL FOR ACCOUNTING TABLE
      if (updateItemDto.paidUsd1 !== undefined) {
        updateData.paidUsd1 = updateItemDto.paidUsd1;
      }
      if (updateItemDto.paidUsd2 !== undefined) {
        updateData.paidUsd2 = updateItemDto.paidUsd2;
      }
      if (updateItemDto.paidTl1 !== undefined) {
        updateData.paidTl1 = updateItemDto.paidTl1;
      }
      if (updateItemDto.paidTl2 !== undefined) {
        updateData.paidTl2 = updateItemDto.paidTl2;
      }

      // Status-driven date automation (shared helper)
      if (updateItemDto.status !== undefined) {
        const dateUpdates = applyStatusDateAutomation(
          existingItem.status,
          updateItemDto.status,
          existingItem,
          { rtrField: 'rtr', hasRtd: true },
        );
        Object.assign(updateData, dateUpdates);
      }

      // Handle PF code generation if vendor/type/orderType changed
      let newPfCode = existingItem.pfCode;
      const effectiveVendorId = updateItemDto.vendorId || existingItem.vendorId;
      const effectiveType = updateItemDto.type || existingItem.type;
      const effectiveOrderType = updateItemDto.orderType !== undefined ? updateItemDto.orderType : existingItem.orderType;
      const vendorChanged = updateItemDto.vendorId && updateItemDto.vendorId !== existingItem.vendorId;
      const typeChanged = updateItemDto.type && updateItemDto.type !== existingItem.type;
      const orderTypeChanged = updateItemDto.orderType !== undefined && updateItemDto.orderType !== existingItem.orderType;
      if (effectiveVendorId && (vendorChanged || typeChanged || orderTypeChanged) && (!existingItem.pfCode || orderTypeChanged)) {
        try {
          newPfCode = await this.generatePfCodeForItem(
            existingItem.case.derivedProjectCode,
            effectiveVendorId,
            effectiveType,
            effectiveOrderType
          );
          updateData.pfCode = newPfCode;
        } catch (error) {
          console.error('Failed to generate PF code for missing/extra item:', error);
        }
      }

      // Update the item
      const updatedItem = await prisma.missingExtraItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          vendor: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          customType: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // 🎯 DB_TRUTH VERIFICATION: Re-fetch from database to prove persistence
      const dbTruthItem = await prisma.missingExtraItem.findUnique({
        where: { id: itemId },
        select: {
          id: true,
          paidUsd1: true,
          paidUsd2: true,
          paidTl1: true,
          paidTl2: true
        }
      });

      // UNIFIED AUDIT LOG: Write to audit_logs table
      if (userId) {
        const userInfo = await this.auditLogService.resolveUser(userId);
        const auditEntries: Array<any> = [];
        const fieldsToTrack = [
          'status', 'poSignStatus', 'pfSignStatus', 'orderType',
          'pfUsd', 'pfTl', 'std', 'etd', 'rtd', 'rtr', 'ftd',
          'containerNo', 'containerDate', 'paymentRule',
          'paidUsd1', 'paidUsd2', 'paidTl1', 'paidTl2',
          'invoiceTransactionNo', 'invoiceNumber', 'quickBook',
        ];

        for (const key of fieldsToTrack) {
          const newVal = updateData[key] !== undefined ? updateData[key] : (updateItemDto as any)[key];
          if (newVal === undefined) continue;

          const oldRaw = (existingItem as any)[key];
          const fmt = (v: any) => v?.toISOString?.() || v?.toString?.() || v || null;
          const oldStr = fmt(oldRaw);
          const newStr = fmt(newVal);

          if (oldStr !== newStr) {
            auditEntries.push({
              domain: 'MISSING_EXTRA',
              entityId: itemId,
              entityType: 'MissingExtraItem',
              projectRef: existingItem.case?.derivedProjectCode || null,
              field: key,
              oldValue: oldStr,
              newValue: newStr,
              userId,
              userName: userInfo?.name,
              userRole: userInfo?.role,
            });
          }
        }

        // Track vendor changes with resolved names instead of UUIDs
        const newVendorId = updateData.vendorId !== undefined ? updateData.vendorId : (updateItemDto as any).vendorId;
        if (newVendorId !== undefined && (existingItem as any).vendorId !== newVendorId) {
          const oldVendorName = (existingItem as any).vendor?.name || null;
          let newVendorName: string | null = null;
          if (newVendorId) {
            const newVendor = await this.prismaService.vendor.findUnique({ where: { id: newVendorId }, select: { name: true } });
            newVendorName = newVendor?.name || newVendorId;
          }
          auditEntries.push({
            domain: 'MISSING_EXTRA',
            entityId: itemId,
            entityType: 'MissingExtraItem',
            projectRef: existingItem.case?.derivedProjectCode || null,
            field: 'vendor',
            oldValue: oldVendorName,
            newValue: newVendorName,
            userId,
            userName: userInfo?.name,
            userRole: userInfo?.role,
          });
        }

        if (auditEntries.length > 0) {
          this.auditLogService.logBatch(auditEntries).catch(() => { });
        }
      }

      const formattedResponse = this.formatItemResponse(updatedItem);

      return formattedResponse;
    });

    this.supplierTotalsService.invalidateCache();
    this.eventsGateway.emitToRooms(['missing-extra', 'suppliers', 'dashboard'], 'me-item:updated', { item: result }, userId);

    // Patch-based event: emit only changed fields for cell-level live updates
    if (userId) {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(updateItemDto)) {
        if (['id', 'createdAt', 'caseId'].includes(key)) continue;
        const val = (result as any)[key];
        patch[key] = val instanceof Date ? val.toISOString() : val;
      }
      // Include all auto-generated date fields from status automation
      for (const df of ['std', 'etd', 'rtr', 'rtd', 'rdy', 'ftd', 'snd']) {
        if (!(df in patch)) {
          const val = (result as any)[df];
          patch[df] = val instanceof Date ? val.toISOString() : val ?? null;
        }
      }
      // Include pfCode if it was auto-generated
      if (result.pfCode !== undefined && !('pfCode' in patch)) {
        patch.pfCode = result.pfCode;
      }
      // Always include vendor and customType in patch so other clients don't lose them
      if (result.vendor) {
        patch.vendor = result.vendor;
      }
      if (result.vendorId !== undefined) {
        patch.vendorId = result.vendorId;
      }
      if (result.customType) {
        patch.customType = result.customType;
      }
      this.eventsGateway.emitPatchEvent(['missing-extra', 'suppliers', 'dashboard'], {
        entity: 'meItem',
        entityId: itemId,
        parentId: existingItem.caseId,
        patch,
        updatedAt: (result as any).updatedAt || new Date().toISOString(),
        updatedBy: userId,
        mutationId: EventsGateway.generateMutationId(),
      });
    }

    return result;
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string, userId?: string): Promise<{ message: string }> {
    const item = await this.prismaService.missingExtraItem.findUnique({
      where: { id: itemId },
      include: { case: { select: { derivedProjectCode: true } } },
    });

    if (!item) {
      throw new NotFoundException('Missing & Extra item not found');
    }

    const now = new Date();
    await this.prismaService.$transaction([
      this.prismaService.missingExtraItem.update({ where: { id: itemId }, data: { deletedAt: now } }),
      this.prismaService.trashBin.create({
        data: {
          entityType: 'MissingExtraItem',
          entityId: itemId,
          entityLabel: `${item.type || 'Custom'} item - ${item.case?.derivedProjectCode || 'unknown'}`,
          moduleGroup: 'missing-extra-items',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          parentId: item.caseId,
          parentLabel: item.case?.derivedProjectCode,
        },
      }),
    ]);

    // AUDIT LOG: ME item deletion
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      this.auditLogService.log({
        domain: 'MISSING_EXTRA',
        entityId: itemId,
        entityType: 'MissingExtraItem',
        projectRef: item.case?.derivedProjectCode || null,
        field: 'item',
        oldValue: `${item.type || 'custom'} item`,
        newValue: null,
        action: 'DELETE',
        userId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(() => { });
    }

    this.supplierTotalsService.invalidateCache();
    this.eventsGateway.emitToRooms(['missing-extra', 'suppliers', 'dashboard'], 'me-item:deleted', { itemId, caseId: item.caseId }, userId);
    return { message: 'Missing & Extra item deleted successfully' };
  }

  /**
   * Delete a case
   */
  async deleteCase(id: string, userId?: string): Promise<{ message: string }> {
    const caseItem = await this.prismaService.missingExtraCase.findUnique({
      where: { id },
    });

    if (!caseItem) {
      throw new NotFoundException('Missing & Extra case not found');
    }

    const now = new Date();
    // Free up the derivedProjectCode unique constraint so the same code can be re-created later
    const freedCode = `${caseItem.derivedProjectCode}__deleted__${now.getTime()}`;
    await this.prismaService.$transaction([
      this.prismaService.missingExtraCase.update({
        where: { id },
        data: { deletedAt: now, derivedProjectCode: freedCode },
      }),
      this.prismaService.trashBin.create({
        data: {
          entityType: 'MissingExtraCase',
          entityId: id,
          entityLabel: `${caseItem.caseType} - ${caseItem.baseProjectName} (${caseItem.derivedProjectCode})`,
          moduleGroup: 'missing-extra',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          parentLabel: caseItem.baseProjectNo,
        },
      }),
    ]);

    // AUDIT LOG: Case deletion
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      this.auditLogService.log({
        domain: 'MISSING_EXTRA',
        entityId: id,
        entityType: 'MissingExtraCase',
        projectRef: caseItem.derivedProjectCode,
        field: 'case',
        oldValue: `${caseItem.caseType} case - ${caseItem.baseProjectName}`,
        newValue: null,
        action: 'DELETE',
        userId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(() => { });
    }

    this.supplierTotalsService.invalidateCache();
    this.eventsGateway.emitToRooms(['missing-extra', 'suppliers', 'dashboard'], 'me-case:deleted', { caseId: id }, userId);
    return { message: 'Missing & Extra case deleted successfully' };
  }

  private generateDerivedProjectCode(baseProjectNo: string, caseType: CaseType, index: number): string {
    const suffix = this.getCaseTypeSuffix(caseType);
    return `${baseProjectNo}-${suffix}-${index}`;
  }

  private getCaseTypeSuffix(caseType: CaseType): string {
    switch (caseType) {
      case 'REPLACEMENT':
        return 'RE';
      case 'EXTRA':
        return 'EX';
      case 'MISSING':
        return 'MS';
      default:
        return 'UN';
    }
  }

  private async generatePfCodeForItem(derivedProjectCode: string, vendorId: string, type: string, orderType?: string): Promise<string> {
    // Use the existing PF code generation service but with derived project code
    const vendor = await this.prismaService.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const typeLetters = {
      'MILLWORK': 'M',
      'SHELVING': 'S',
      'CEILING': 'C',
      'IMAGE': 'I',
      'FURNITURE': 'F',
    };

    const typeLetter = typeLetters[type] || 'X';

    // YSM/GOS vendor + MILLWORK type: fixed index based on orderType
    if (vendor.fixedMillworkCodes && type === 'MILLWORK' && orderType) {
      const orderTypeName = orderType.toUpperCase().trim();
      let letter = typeLetter; // default M
      let fixedIndex: number;
      if (orderTypeName.includes('CUSTOM')) {
        fixedIndex = 3; // M03 - SELECTIVE / CUSTOM
      } else if (orderTypeName.includes('SELECTIVE')) {
        fixedIndex = 2; // M02 - STANDARD / SELECTIVE
      } else if (orderTypeName.includes('FURNITURE')) {
        letter = 'F';
        fixedIndex = 1; // F01 - FURNITURE
      } else {
        fixedIndex = 1; // M01 - STANDARD / BASIC
      }
      const indexStr = fixedIndex.toString().padStart(2, '0');
      return `${vendor.code}-${derivedProjectCode}-${letter}${indexStr}`;
    }

    // Default: auto-increment logic for non-YSM or non-MILLWORK
    const existingItems = await this.prismaService.missingExtraItem.findMany({
      where: {
        case: {
          derivedProjectCode: derivedProjectCode,
        },
        type: type as any,
        vendorId: vendorId,
      },
      orderBy: {
        pfCode: 'asc',
      },
    });

    let nextIndex = 1;

    if (existingItems.length > 0) {
      // Find the highest index
      const indices = existingItems
        .filter(item => item.pfCode)
        .map(item => {
          const match = item.pfCode.match(new RegExp(`-${typeLetter}(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(index => !isNaN(index));

      if (indices.length > 0) {
        nextIndex = Math.max(...indices) + 1;
      }
    }

    const indexStr = nextIndex.toString().padStart(2, '0');
    return `${vendor.code}-${derivedProjectCode}-${typeLetter}${indexStr}`;
  }

  private formatCaseResponse(caseItem: any): MissingExtraCaseResponse {
    return {
      id: caseItem.id,
      baseProjectId: caseItem.baseProjectId,
      baseProjectNo: caseItem.baseProjectNo,
      baseProjectName: caseItem.baseProjectName,
      section: caseItem.section,
      caseType: caseItem.caseType,
      caseIndex: caseItem.caseIndex,
      derivedProjectCode: caseItem.derivedProjectCode,
      types: caseItem.types || [],
      halfOfYear: caseItem.halfOfYear ?? null,
      halfYear: caseItem.halfYear ?? null,
      createdAt: caseItem.createdAt.toISOString(),
      updatedAt: caseItem.updatedAt.toISOString(),
      baseProject: caseItem.baseProject,
      items: caseItem.items ? caseItem.items.map((item) => this.formatItemResponse(item)) : undefined,
    };
  }

  private formatItemResponse(item: any): MissingExtraItemResponse {
    return {
      id: item.id,
      caseId: item.caseId,
      type: item.type,
      customTypeId: item.customTypeId,
      pfCode: item.pfCode,
      vendorId: item.vendorId,
      orderType: item.orderType,
      poSignStatus: item.poSignStatus,
      pfSignStatus: item.pfSignStatus,
      status: item.status,
      statusNote: item.statusNote || null,
      std: item.std?.toISOString() || null,
      etd: item.etd?.toISOString() || null,
      rtd: item.rtd?.toISOString() || null,
      rtr: item.rtr?.toISOString() || null,
      rdy: item.rdy?.toISOString() || null,
      ftd: item.ftd?.toISOString() || null,
      snd: item.snd?.toISOString() || null,
      containerNo: item.containerNo,
      paymentRule: item.paymentRule,
      pfUsd: item.pfUsd ? parseFloat(item.pfUsd.toString()) : null,
      pfTl: item.pfTl ? parseFloat(item.pfTl.toString()) : null,
      paidUsd1: item.paidUsd1 ? parseFloat(item.paidUsd1.toString()) : null,
      paidUsd2: item.paidUsd2 ? parseFloat(item.paidUsd2.toString()) : null,
      paidTl1: item.paidTl1 ? parseFloat(item.paidTl1.toString()) : null,
      paidTl2: item.paidTl2 ? parseFloat(item.paidTl2.toString()) : null,
      invoice: item.invoice ? parseFloat(item.invoice.toString()) : null,
      invoiceTl: item.invoiceTl ? parseFloat(item.invoiceTl.toString()) : null,
      invoiceTransactionNo: item.invoiceTransactionNo ?? null,
      invoiceNumber: item.invoiceNumber ?? null,
      quickBook: item.quickBook ?? null,
      invoiceDate: item.invoiceDate?.toISOString() || null,
      duePaid: item.duePaid ?? false,
      paidUsd1Date: item.paidUsd1Date?.toISOString() || null,
      paidUsd2Date: item.paidUsd2Date?.toISOString() || null,
      paidTl1Date: item.paidTl1Date?.toISOString() || null,
      paidTl2Date: item.paidTl2Date?.toISOString() || null,
      containerDate: item.containerDate?.toISOString() || null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      vendor: item.vendor,
      customType: item.customType,
    };
  }

  /**
   * Update Missing & Extra item with field-level authorization
   * Same pattern as ProjectsService.updateProjectItemWithFieldAuthorization()
   */
  async updateItemWithFieldAuthorization(
    itemId: string,
    updateItemDto: UpdateMissingExtraItemDto,
    userId: string,
  ): Promise<MissingExtraItemResponse> {
    // Load user with role permissions
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            roleColumnVisibility: true,
          },
        },
      },
    });

    if (!user || !user.role) {
      throw new ForbiddenException('User or role not found');
    }

    // ✅ V2 PERMISSION CHECK: Check if V2 is enabled for supplier-me-sheet
    const isV2Enabled = this.accessControlService.isV2Enabled('supplier-me-sheet', userId);
    if (isV2Enabled) {
      const v2Decision = await this.checkV2Permissions(userId, itemId, updateItemDto);

      // Standardized V2 logging for each field
      const userFields = Object.keys(updateItemDto).filter(field =>
        !['id', 'createdAt', 'updatedAt', 'caseId'].includes(field)
      );

      if (!v2Decision.allowed) {
        throw new ForbiddenException({
          message: 'Forbidden: You cannot edit these fields',
          blockedFields: v2Decision.metadata.blockedFields || [],
          reason: v2Decision.reason
        });
      }

      // Continue with V2-authorized update (skip legacy permission checks)
    }

    // Legacy permission check (only if V2 is disabled)
    if (!isV2Enabled) {

      const columnsHidden: string[] = [];
      const columnsReadOnly: string[] = [];

      user.role.roleColumnVisibility.forEach((cv) => {
        if (cv.isHidden) {
          columnsHidden.push(cv.columnKey);
        } else if (cv.isReadOnly) {
          columnsReadOnly.push(cv.columnKey);
        }
      });

      // Get fields user is trying to update
      const systemFields = ['id', 'createdAt', 'updatedAt', 'caseId'];
      const userFields = Object.keys(updateItemDto).filter(
        (field) => !systemFields.includes(field),
      );

      // Validate against blocked fields
      const blockedFields: string[] = [];
      for (const field of userFields) {
        const canonicalField = this.mapToCanonicalColumnKey(field);
        if (columnsHidden.includes(canonicalField) || columnsReadOnly.includes(canonicalField)) {
          blockedFields.push(field);
        }
      }

      // Throw if any fields are blocked
      if (blockedFields.length > 0) {
        throw new ForbiddenException({
          message: 'You do not have permission to edit these fields for your role',
          blockedFields,
          role: user.role.name,
        });
      }
    }

    // All fields are authorized - proceed with update
    return this.updateItem(itemId, updateItemDto, userId);
  }

  /**
   * Map field names to canonical column keys for permission checking
   * Same mapping logic as ProjectsService
   */
  private mapToCanonicalColumnKey(field: string): string {
    const fieldMapping: { [key: string]: string } = {
      vendorId: 'vendor',
      orderType: 'orderType',
      poSignStatus: 'poSignStatus',
      pfSignStatus: 'pfSignStatus',
      status: 'status',
      std: 'std',
      etd: 'etd',
      rtd: 'rtd',
      rtr: 'rtr',
      ftd: 'ftd',
      pfUsd: 'pfUsd',
      pfTl: 'pfTl',
      paidUsd1: 'paidUsd1',
      paidUsd2: 'paidUsd2',
      paidTl1: 'paidTl1',
      paidTl2: 'paidTl2',
      containerNo: 'containerNo',
      type: 'type',
    };

    return fieldMapping[field] || field;
  }

  /**
   * CLEANUP METHODS - for development/testing
   */
  async countAllCases(): Promise<number> {
    return this.prismaService.missingExtraCase.count();
  }

  async countAllItems(): Promise<number> {
    return this.prismaService.missingExtraItem.count();
  }

  async deleteAllItems(): Promise<void> {
    await this.prismaService.missingExtraItem.deleteMany({});
  }

  async deleteAllCases(): Promise<void> {
    await this.prismaService.missingExtraCase.deleteMany({});
  }

  /**
   * Seed predictable test data for Missing & Extra module
   */
  async seedTestData(): Promise<{ casesCount: number; itemsCount: number }> {

    const seedCases = [
      {
        baseProjectNo: '301',
        baseProjectName: 'Test Project Alpha',
        section: 'TLINES_NE',
        caseType: 'MISSING',
        caseIndex: 1,
        derivedProjectCode: '301-MS-1',
        types: ['Millwork', 'Shelving'],
        items: [
          { type: 'MILLWORK', pfUsd: 1500, pfTl: 2500, status: 'NOT_ORDERED' },
          { type: 'SHELVING', pfUsd: 800, pfTl: 1200, status: 'NOT_ORDERED' }
        ]
      },
      {
        baseProjectNo: '234',
        baseProjectName: 'Test Project Beta',
        section: 'TLINES_SE',
        caseType: 'EXTRA',
        caseIndex: 1,
        derivedProjectCode: '234-EX-1',
        types: ['Furniture'],
        items: [
          { type: 'FURNITURE', pfUsd: 2200, pfTl: 3000, status: 'ORDERED' }
        ]
      },
      {
        baseProjectNo: '121',
        baseProjectName: 'Test Project Gamma',
        section: 'TLines CVW',
        caseType: 'REPLACEMENT',
        caseIndex: 1,
        derivedProjectCode: '121-RE-1',
        types: ['Ceiling'],
        items: [] // No items initially
      }
    ];

    let totalCases = 0;
    let totalItems = 0;

    for (const seedCase of seedCases) {

      const createdCase = await this.prismaService.missingExtraCase.create({
        data: {
          baseProjectNo: seedCase.baseProjectNo,
          baseProjectName: seedCase.baseProjectName,
          section: seedCase.section as any,
          caseType: seedCase.caseType as any,
          caseIndex: seedCase.caseIndex,
          derivedProjectCode: seedCase.derivedProjectCode,
          types: seedCase.types,
        }
      });

      totalCases++;

      // Create items for this case
      for (const seedItem of seedCase.items) {

        await this.prismaService.missingExtraItem.create({
          data: {
            caseId: createdCase.id,
            type: seedItem.type as any,
            pfSignStatus: 'NOT_SIGNED',
            poSignStatus: 'NOT_SIGNED',
            status: seedItem.status as any,
            pfUsd: seedItem.pfUsd,
            pfTl: seedItem.pfTl,
          }
        });

        totalItems++;
      }
    }


    return {
      casesCount: totalCases,
      itemsCount: totalItems
    };
  }

  /**
   * ===== V2 PERMISSION METHODS =====
   * Column filtering and permission checking for Missing/Extra items
   */

  /**
   * Filter item by visible columns for supplier-me-sheet table
   */
  private filterItemByVisibleColumns(item: any, visibleColumns: string[]): any {
    // Always include system/relationship fields
    const systemFields = ['id', 'caseId', 'createdAt', 'updatedAt', 'vendor', 'case', 'pfCode', 'vendorId', 'customTypeId', 'customType', 'orderType', 'std', 'etd', 'rtd', 'rtr', 'ftd', 'rdy', 'snd', 'containerNo', 'containerDate', 'paymentRule'];

    // Missing/Extra specific column mapping - permission-controlled fields only
    const columnFieldMap: Record<string, string> = {
      'type': 'type',
      'pfSignStatus': 'pfSignStatus',
      'poSignStatus': 'poSignStatus',
      'status': 'status',
      'pfUsd': 'pfUsd',
      'pfTl': 'pfTl',
    };

    // Start with system fields
    const filteredItem: any = {};

    // Add system fields
    systemFields.forEach(field => {
      if (item[field] !== undefined) {
        filteredItem[field] = item[field];
      }
    });

    // Add visible data fields
    visibleColumns.forEach(column => {
      const fieldName = columnFieldMap[column];
      if (fieldName && fieldName.includes('.')) {
        // Handle nested fields like vendor.code
        const [parentField, childField] = fieldName.split('.');
        if (item[parentField] && item[parentField][childField] !== undefined) {
          if (!filteredItem[parentField]) filteredItem[parentField] = {};
          filteredItem[parentField][childField] = item[parentField][childField];
        }
      } else if (fieldName && item[fieldName] !== undefined) {
        filteredItem[fieldName] = item[fieldName];
      }
    });

    // VALIDATION: Track hidden fields for strict testing
    const allDataFields = Object.keys(columnFieldMap);
    const hiddenFields = allDataFields.filter(field => !visibleColumns.includes(field));
    const filteredOutFields = hiddenFields.filter(field => {
      const fieldName = columnFieldMap[field];
      return item[fieldName] !== undefined;
    });

    return filteredItem;
  }

  /**
   * Check V2 permissions for supplier-me-sheet table
   */
  private async checkV2Permissions(
    userId: string,
    itemId: string,
    updateData: any
  ): Promise<PermissionDecision> {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: { role: true }
      });

      if (!user) {
        return {
          allowed: false,
          reason: 'User not found',
          metadata: { userId }
        };
      }

      // Get column rules for supplier-me-sheet table
      const columnRules = await this.accessControlService.getSupplierColumnRulesByTableAndRole(
        'supplier-me-sheet',
        user.role.id
      );

      // Check each field in update data
      // Only block fields with EXPLICIT restrictions (HIDDEN or READ_ONLY)
      // Fields without rules are allowed by default
      const userFields = Object.keys(updateData);
      const blockedFields: string[] = [];

      for (const field of userFields) {
        const canonicalKey = this.mapToCanonicalColumnKey(field);
        const rule = columnRules[canonicalKey];

        if (rule === 'HIDDEN' || rule === 'READ_ONLY') {
          blockedFields.push(field);
        }
      }

      const allowed = blockedFields.length === 0;

      return {
        allowed,
        reason: allowed ? undefined : `Fields are hidden or read-only for role ${user.role.name}: ${blockedFields.join(', ')}`,
        metadata: {
          userId,
          role: user.role.name,
          tableId: 'supplier-me-sheet',
          blockedFields,
          columnsHidden: Object.keys(columnRules).filter(k => columnRules[k] === 'HIDDEN'),
          columnsReadOnly: Object.keys(columnRules).filter(k => columnRules[k] === 'READ_ONLY')
        }
      };
    } catch (error) {
      console.error('❌ [V2_PERMISSION_CHECK] Failed to check permissions:', error);
      return {
        allowed: false,
        reason: 'Permission check failed',
        metadata: { userId, error: error.message }
      };
    }
  }

}