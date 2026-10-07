import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { applyStatusDateAutomation } from '../common/helpers/status-date-automation';
import { CreateDirectOrderProjectDto, UpdateDirectOrderProjectDto } from './dto/create-direct-order-project.dto';
import { CreateDirectOrderItemDto, UpdateDirectOrderItemDto } from './dto/create-direct-order-item.dto';
import { DirectOrderPfCodeGenerationService } from './services/direct-order-pf-code-generation.service';
import { Prisma, ProjectBucket, DirectOrderProject, DirectOrderItem, ProjectItemType } from '@prisma/client';
import { AccessControlService, PermissionDecision } from '../permissions/services/access-control.service';
import { TypeVisibilityService } from '../permissions/services/type-visibility.service';
import { ProjectScopeService } from '../permissions/services/project-scope.service';
import { CustomTypesService } from '../custom-types/custom-types.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SupplierTotalsService } from '../supplier-totals/supplier-totals.service';
import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class DirectOrdersService {
  constructor(
    private prisma: PrismaService,
    private pfCodeGenerationService: DirectOrderPfCodeGenerationService,
    private accessControlService: AccessControlService,
    private customTypesService: CustomTypesService,
    private auditLogService: AuditLogService,
    private typeVisibilityService: TypeVisibilityService,
    private projectScopeService: ProjectScopeService,
    private supplierTotalsService: SupplierTotalsService,
    private eventsGateway: EventsGateway,
  ) { }

  // ===================== PROJECT METHODS =====================

  async createProject(createDto: CreateDirectOrderProjectDto, createdByUserId?: string) {
    const { projectNo: inputProjectNo, bucket, types, ...rest } = createDto;

    // Normalize and validate project number
    const normalizedProjectNo = await this.normalizeAndValidateProjectNo(inputProjectNo, bucket);

    try {
      // First create the project without items
      const project = await this.prisma.directOrderProject.create({
        data: {
          ...rest,
          projectNo: normalizedProjectNo,
          bucket,
          createdByUserId,
        },
        include: {
          createdBy: true,
        },
      });

      // Then create items with proper enum vs custom type handling
      const enumTypes = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];

      if (types && types.length > 0) {
        for (const typeName of types) {
          const normalizedType = typeName.trim();

          if (enumTypes.includes(normalizedType.toUpperCase())) {
            // Enum type
            await this.prisma.directOrderItem.create({
              data: {
                projectId: project.id,
                type: normalizedType.toUpperCase() as any,
                customTypeId: null,
                status: 'NOT_ORDERED' as any,
              },
            });
          } else {
            // Custom type - create if doesn't exist
            const customType = await this.customTypesService.createIfNotExists(normalizedType);
            await this.prisma.directOrderItem.create({
              data: {
                projectId: project.id,
                type: null,
                customTypeId: customType.id,
                status: 'NOT_ORDERED' as any,
              },
            });
          }
        }
      }

      // Return project with all relations
      const finalProject = await this.prisma.directOrderProject.findUnique({
        where: { id: project.id },
        include: {
          items: {
            include: {
              vendor: true,
              customType: true,
              orderTypeRef: true,
            },
          },
          createdBy: true,
        },
      });

      // AUDIT LOG: DO project creation
      if (createdByUserId && finalProject) {
        const userInfo = await this.auditLogService.resolveUser(createdByUserId);
        this.auditLogService.log({
          domain: 'DIRECT_ORDER',
          entityId: finalProject.id,
          entityType: 'DirectOrderProject',
          projectRef: normalizedProjectNo,
          field: 'project',
          oldValue: null,
          newValue: `Created: ${finalProject.name || normalizedProjectNo}`,
          action: 'CREATE',
          userId: createdByUserId,
          userName: userInfo?.name,
          userRole: userInfo?.role,
        }).catch(() => { });
      }

      if (finalProject) {
        this.eventsGateway.emitToRooms(['direct-orders', 'suppliers', 'dashboard'], 'do-project:created', { project: finalProject }, createdByUserId);
      }

      return finalProject;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Direct Order project ${normalizedProjectNo} already exists in ${bucket}`);
      }
      throw error;
    }
  }

  async findAllProjects(bucket?: ProjectBucket, user?: any) {
    const where: Prisma.DirectOrderProjectWhereInput = bucket ? { bucket, deletedAt: null } : { deletedAt: null };

    // Apply project scope filter (match by projectNo)
    if (user?.roleId) {
      const refs = await this.projectScopeService.getAssignedProjectRefs(user.roleId);
      if (refs !== null) {
        const allowedNos = refs.map(r => r.projectNo);
        where.projectNo = { in: allowedNos };
      }
    }

    const projects = await this.prisma.directOrderProject.findMany({
      where,
      include: {
        items: {
          where: { deletedAt: null },
          include: {
            vendor: true,
            customType: true,
            orderTypeRef: true,
          },
        },
        createdBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // ✅ V2 COLUMN FILTERING: Apply permission-based filtering to items
    let filteredProjects = projects;
    if (user?.id) {
      const startTime = Date.now();
      const isV2Enabled = this.accessControlService.isV2Enabled('supplier-do-sheet', user.id);

      if (isV2Enabled) {
        // Get visible columns for this user
        const visibleColumns = await this.accessControlService.getSupplierDoVisibleColumns(user.id);

        // Apply filtering to all items in all projects
        filteredProjects = projects.map(project => ({
          ...project,
          items: project.items.map(item => this.filterItemByVisibleColumns(item, visibleColumns))
        }));
      }
    }

    return filteredProjects;
  }

  async findProjectById(id: string) {
    const project = await this.prisma.directOrderProject.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            vendor: true,
            customType: true,
            orderTypeRef: true,
          },
        },
        createdBy: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Direct Order project with ID ${id} not found`);
    }

    return project;
  }

  async updateProject(id: string, updateDto: UpdateDirectOrderProjectDto, userId?: string) {
    const existing = await this.findProjectById(id);

    const project = await this.prisma.directOrderProject.update({
      where: { id },
      data: updateDto,
      include: {
        items: {
          include: {
            vendor: true,
            customType: true,
            orderTypeRef: true,
          },
        },
        createdBy: true,
      },
    });

    // AUDIT LOG: DO project update
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      const auditEntries: Array<any> = [];
      const fieldsToTrack = ['name', 'projectNo', 'status', 'bucket', 'address'];
      for (const field of fieldsToTrack) {
        const newVal = (updateDto as any)[field];
        if (newVal === undefined) continue;
        const oldVal = (existing as any)[field];
        const fmt = (v: any) => v?.toString?.() || null;
        if (fmt(oldVal) !== fmt(newVal)) {
          auditEntries.push({
            domain: 'DIRECT_ORDER',
            entityId: id,
            entityType: 'DirectOrderProject',
            projectRef: existing.projectNo,
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

    this.eventsGateway.emitToRooms(['direct-orders', 'suppliers', 'dashboard'], 'do-project:updated', { project }, userId);
    return project;
  }

  async bulkAssignHalf(
    dto: { projectIds: string[]; halfOfYear?: string | null; halfYear?: number | null },
    userId?: string,
  ): Promise<{ updatedCount: number }> {
    if (!dto.projectIds || dto.projectIds.length === 0) {
      throw new BadRequestException('projectIds is required and must not be empty');
    }

    const { count } = await this.prisma.directOrderProject.updateMany({
      where: { id: { in: dto.projectIds } },
      data: {
        halfOfYear: (dto.halfOfYear ?? null) as any,
        halfYear: dto.halfYear ?? null,
      },
    });

    // No excludeUserId: this action is meant to be seen cross-page in the same
    // session too (Direct Order → Suppliers), not just by other users.
    this.eventsGateway.emitToRooms(['direct-orders', 'suppliers', 'dashboard'], 'do-project:updated', { projectIds: dto.projectIds });

    return { updatedCount: count };
  }

  async deleteProject(id: string, userId?: string) {
    const project = await this.findProjectById(id);

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.directOrderProject.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'DirectOrderProject',
          entityId: id,
          entityLabel: `${project.name || project.projectNo} (${project.projectNo})`,
          moduleGroup: 'direct-orders',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);
    const result = { id };

    // AUDIT LOG: DO project deletion
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      this.auditLogService.log({
        domain: 'DIRECT_ORDER',
        entityId: id,
        entityType: 'DirectOrderProject',
        projectRef: project.projectNo,
        field: 'project',
        oldValue: `${project.name || project.projectNo}`,
        newValue: null,
        action: 'DELETE',
        userId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(() => { });
    }

    this.eventsGateway.emitToRooms(['direct-orders', 'suppliers', 'dashboard'], 'do-project:deleted', { projectId: id }, userId);
    return result;
  }

  // ===================== ITEM METHODS =====================

  async createItem(projectId: string, createDto: CreateDirectOrderItemDto, changedByUserId?: string) {
    // Check if project exists
    await this.findProjectById(projectId);

    let item = await this.prisma.directOrderItem.create({
      data: {
        ...createDto,
        projectId,
        pfSignStatus: createDto.pfSignStatus ?? 'NOT_SIGNED',
        poSignStatus: createDto.poSignStatus ?? 'NOT_SIGNED',
        status: createDto.status ?? 'NOT_ORDERED',
      },
      include: {
        vendor: true,
        customType: true,
        orderTypeRef: true,
      },
    });

    // Auto-generate PF code if vendor and type (enum or custom) are provided
    if (createDto.vendorId && (createDto.type || createDto.customTypeId)) {
      try {
          const generatedPfCode = await this.pfCodeGenerationService.autoAssignPfCodeIfNeeded(
          projectId,
          item.id,
          createDto.vendorId,
          createDto.type as ProjectItemType,
          createDto.customTypeId || null,
          createDto.orderType || null
        );

        if (generatedPfCode) {
          // Update the item with the generated PF code
          item = await this.prisma.directOrderItem.update({
            where: { id: item.id },
            data: { pfCode: generatedPfCode },
            include: {
              vendor: true,
              customType: true,
              orderTypeRef: true,
            },
          });
        }
      } catch (error) {
        console.error(`⚠️ Failed to auto-generate PF code for new item ${item.id}:`, error);
        // Don't throw - PF code generation failure shouldn't block the creation
      }
    }

    // Log the creation
    await this.logItemChange(projectId, item.id, 'CREATED', null, 'Item created', changedByUserId);

    // AUDIT LOG: DO item creation
    if (changedByUserId) {
      const project = await this.prisma.directOrderProject.findUnique({ where: { id: projectId }, select: { projectNo: true } });
      const userInfo = await this.auditLogService.resolveUser(changedByUserId);
      this.auditLogService.log({
        domain: 'DIRECT_ORDER',
        entityId: item.id,
        entityType: 'DirectOrderItem',
        projectRef: project?.projectNo || null,
        field: 'item',
        oldValue: null,
        newValue: `Created: ${item.type || 'custom'} item`,
        action: 'CREATE',
        userId: changedByUserId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(() => { });
    }

    this.supplierTotalsService.invalidateCache();
    this.eventsGateway.emitToRooms(['direct-orders', 'suppliers', 'dashboard'], 'do-item:created', { item, projectId }, changedByUserId);
    return item;
  }

  async updateItem(projectId: string, itemId: string, updateDto: UpdateDirectOrderItemDto, changedByUserId?: string) {
    // Get current item for change logging
    const currentItem = await this.prisma.directOrderItem.findUnique({
      where: { id: itemId },
      include: { vendor: true },
    });

    if (!currentItem) {
      throw new NotFoundException(`Direct Order item with ID ${itemId} not found`);
    }

    if (currentItem.projectId !== projectId) {
      throw new BadRequestException(`Item ${itemId} does not belong to project ${projectId}`);
    }

    // ========== BUSINESS RULES: AUTOMATIC DATE ASSIGNMENT ==========
    // Strip undefined values — Prisma 5 tries to coerce undefined Decimal fields and throws
    const updateData: any = Object.fromEntries(
      Object.entries({ ...updateDto }).filter(([, v]) => v !== undefined)
    );

    // Convert date strings to Date objects for dates that are explicitly provided
    if (updateDto.std) updateData.std = new Date(updateDto.std);
    if (updateDto.etd) updateData.etd = new Date(updateDto.etd);
    if (updateDto.rtd) updateData.rtd = new Date(updateDto.rtd);
    if (updateDto.rtr) updateData.rtr = new Date(updateDto.rtr);
    if (updateDto.ftd) updateData.ftd = new Date(updateDto.ftd);
    if (updateDto.rdy) updateData.rdy = new Date(updateDto.rdy);
    if (updateDto.snd) updateData.snd = new Date(updateDto.snd);
    if (updateDto.containerDate) updateData.containerDate = new Date(updateDto.containerDate);

    // Convert paid date fields (nullable)
    if (updateDto.paidUsd1Date !== undefined) updateData.paidUsd1Date = updateDto.paidUsd1Date ? new Date(updateDto.paidUsd1Date) : null;
    if (updateDto.paidUsd2Date !== undefined) updateData.paidUsd2Date = updateDto.paidUsd2Date ? new Date(updateDto.paidUsd2Date) : null;
    if (updateDto.paidTl1Date !== undefined) updateData.paidTl1Date = updateDto.paidTl1Date ? new Date(updateDto.paidTl1Date) : null;
    if (updateDto.paidTl2Date !== undefined) updateData.paidTl2Date = updateDto.paidTl2Date ? new Date(updateDto.paidTl2Date) : null;
    if (updateDto.invoiceDate !== undefined) updateData.invoiceDate = updateDto.invoiceDate ? new Date(updateDto.invoiceDate) : null;
    if (updateDto.priceNotes !== undefined) updateData.priceNotes = updateDto.priceNotes;

    // Status-driven date automation (shared helper)
    if (updateDto.status !== undefined) {
      const dateUpdates = applyStatusDateAutomation(
        currentItem.status,
        updateDto.status,
        currentItem,
        { rtrField: 'rtr', hasRtd: true },
      );
      Object.assign(updateData, dateUpdates);
    }

    const updatedItem = await this.prisma.directOrderItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        vendor: true,
        customType: true,
        orderTypeRef: true,
      },
    });

    // Auto-generate/regenerate PF code when vendor assigned OR orderType changes (YSM/GOS fixed-index depends on orderType)
    const vendorChangedInUpdate = 'vendorId' in updateDto && updateDto.vendorId;
    const orderTypeChangedInUpdate = 'orderType' in updateDto && updateDto.orderType !== currentItem.orderType;
    if ((vendorChangedInUpdate || orderTypeChangedInUpdate) && (updatedItem.type || updatedItem.customTypeId) && updatedItem.vendorId) {
      try {
        const generatedPfCode = await this.pfCodeGenerationService.regeneratePfCode(itemId);

        if (generatedPfCode) {
          // Update the item with the generated PF code
          const finalItem = await this.prisma.directOrderItem.update({
            where: { id: itemId },
            data: { pfCode: generatedPfCode },
            include: {
              vendor: true,
              customType: true,
              orderTypeRef: true,
            },
          });

          // Log PF code generation
          await this.logItemChange(
            projectId,
            itemId,
            'pfCode',
            updatedItem.pfCode,
            generatedPfCode,
            changedByUserId
          );

          // Update the object for return
          Object.assign(updatedItem, finalItem);
        }
      } catch (error) {
        console.error(`⚠️ Failed to auto-generate PF code for item ${itemId}:`, error);
        // Don't throw - PF code generation failure shouldn't block the update
      }
    }

    // Log changes for each updated field
    const auditEntries: Array<any> = [];
    for (const [field, newValue] of Object.entries(updateDto)) {
      const oldValue = (currentItem as any)[field];
      if (oldValue !== newValue) {
        // Resolve vendor names for vendorId field
        let displayOldValue = oldValue?.toString() || null;
        let displayNewValue = newValue?.toString() || null;
        let displayField = field;

        if (field === 'vendorId') {
          displayField = 'vendor';
          displayOldValue = (currentItem as any).vendor?.name || null;
          if (newValue) {
            const newVendor = await this.prisma.vendor.findUnique({ where: { id: newValue as string }, select: { name: true } });
            displayNewValue = newVendor?.name || (newValue as string);
          } else {
            displayNewValue = null;
          }
        }

        await this.logItemChange(
          projectId,
          itemId,
          field,
          oldValue?.toString() || null,
          newValue?.toString() || null,
          changedByUserId
        );

        // Build audit log entry
        if (changedByUserId) {
          auditEntries.push({
            domain: 'DIRECT_ORDER',
            entityId: itemId,
            entityType: 'DirectOrderItem',
            field: displayField,
            oldValue: displayOldValue,
            newValue: displayNewValue,
            userId: changedByUserId,
          });
        }
      }
    }

    // Write to unified audit log
    if (auditEntries.length > 0 && changedByUserId) {
      const project = await this.prisma.directOrderProject.findUnique({
        where: { id: projectId },
        select: { projectNo: true },
      });
      const userInfo = await this.auditLogService.resolveUser(changedByUserId);
      for (const entry of auditEntries) {
        entry.projectRef = project?.projectNo || null;
        entry.userName = userInfo?.name;
        entry.userRole = userInfo?.role;
      }
      this.auditLogService.logBatch(auditEntries).catch(() => { });
    }

    this.supplierTotalsService.invalidateCache();
    this.eventsGateway.emitToRooms(['direct-orders', 'suppliers', 'dashboard'], 'do-item:updated', { item: updatedItem, projectId }, changedByUserId);

    // Patch-based event: emit only changed fields for cell-level live updates
    if (changedByUserId) {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(updateDto)) {
        if (['id', 'createdAt', 'projectId'].includes(key)) continue;
        const val = (updatedItem as any)[key];
        patch[key] = val instanceof Date ? val.toISOString() : val;
      }
      // Include all auto-generated date fields from status automation
      for (const df of ['std', 'etd', 'rtr', 'rtd', 'rdy', 'ftd', 'snd']) {
        if (!(df in patch)) {
          const val = (updatedItem as any)[df];
          patch[df] = val instanceof Date ? val.toISOString() : val ?? null;
        }
      }
      this.eventsGateway.emitPatchEvent(['direct-orders', 'suppliers', 'dashboard'], {
        entity: 'directOrderItem',
        entityId: itemId,
        parentId: projectId,
        patch,
        updatedAt: (updatedItem as any).updatedAt?.toISOString?.() || new Date().toISOString(),
        updatedBy: changedByUserId,
        mutationId: EventsGateway.generateMutationId(),
      });
    }

    return updatedItem;
  }

  async deleteItem(projectId: string, itemId: string, changedByUserId?: string) {
    const item = await this.prisma.directOrderItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Direct Order item with ID ${itemId} not found`);
    }

    if (item.projectId !== projectId) {
      throw new BadRequestException(`Item ${itemId} does not belong to project ${projectId}`);
    }

    await this.logItemChange(projectId, itemId, 'DELETED', null, 'Item deleted', changedByUserId);

    // AUDIT LOG: DO item deletion
    if (changedByUserId) {
      const project = await this.prisma.directOrderProject.findUnique({ where: { id: projectId }, select: { projectNo: true } });
      const userInfo = await this.auditLogService.resolveUser(changedByUserId);
      this.auditLogService.log({
        domain: 'DIRECT_ORDER',
        entityId: itemId,
        entityType: 'DirectOrderItem',
        projectRef: project?.projectNo || null,
        field: 'item',
        oldValue: `${item.type || 'custom'} item`,
        newValue: null,
        action: 'DELETE',
        userId: changedByUserId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(() => { });
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.directOrderItem.update({ where: { id: itemId }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'DirectOrderItem',
          entityId: itemId,
          entityLabel: `${item.type || 'Custom'} item`,
          moduleGroup: 'direct-order-items',
          deletedAt: now,
          deletedByUserId: changedByUserId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          parentId: projectId,
        },
      }),
    ]);
    const deleted = { id: itemId };

    this.supplierTotalsService.invalidateCache();
    this.eventsGateway.emitToRooms(['direct-orders', 'suppliers', 'dashboard'], 'do-item:deleted', { itemId, projectId }, changedByUserId);
    return deleted;
  }

  // ===================== PF CODE UTILITIES =====================

  /**
   * Fix missing PF codes for all Direct Order items that have vendor and type but no PF code
   */
  async fixMissingPfCodes(): Promise<{ fixed: number; errors: string[] }> {
    const errors: string[] = [];
    let fixed = 0;

    try {
      // Find items that have vendor and type but no PF code
      const itemsNeedingPfCode = await this.prisma.directOrderItem.findMany({
        where: {
          vendorId: { not: null },
          AND: [
            {
              OR: [
                { type: { not: null } },
                { customTypeId: { not: null } }
              ]
            },
            {
              OR: [
                { pfCode: null },
                { pfCode: '' },
                { pfCode: 'undefined' }
              ]
            }
          ]
        },
        include: {
          vendor: true,
          customType: true
        }
      });

;

      for (const item of itemsNeedingPfCode) {
        try {
          const itemTypeInfo = {
            enumType: item.type as ProjectItemType,
            customTypeId: item.customTypeId || undefined
          };

          const generatedPfCode = await this.pfCodeGenerationService.generatePfCodeSafe(
            item.projectId,
            item.vendorId!,
            itemTypeInfo
          );

          await this.prisma.directOrderItem.update({
            where: { id: item.id },
            data: { pfCode: generatedPfCode }
          });

          fixed++;

        } catch (error) {
          const errorMsg = `Failed to fix PF code for item ${item.id}: ${error.message}`;
          console.error(`❌ ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

    } catch (error) {
      const errorMsg = `Failed to query items needing PF codes: ${error.message}`;
      console.error(`❌ ${errorMsg}`);
      errors.push(errorMsg);
    }

    return { fixed, errors };
  }

  // ===================== PRIVATE HELPER METHODS =====================

  private async normalizeAndValidateProjectNo(inputProjectNo: string | undefined, bucket: ProjectBucket): Promise<string> {
    // If no project number provided, generate next available DO number
    if (!inputProjectNo) {
      return await this.generateNextDONumber(bucket);
    }

    let projectNo = inputProjectNo.trim().toUpperCase();

    // If user provided number without DO- prefix, add it
    if (!projectNo.startsWith('DO-')) {
      // Check if it's just a number (e.g., "01", "123")
      if (/^\d+$/.test(projectNo)) {
        projectNo = `DO-${projectNo.padStart(2, '0')}`;
      } else {
        // If it starts with something else (e.g., "P123"), reject it
        throw new BadRequestException('Direct Order project number must start with DO- prefix (e.g., DO-01)');
      }
    }

    // Validate DO- format
    if (!/^DO-\d+$/.test(projectNo)) {
      throw new BadRequestException('Direct Order project number must be in format DO-XX (e.g., DO-01, DO-123)');
    }

    // Check if this project number already exists in the bucket
    const existing = await this.prisma.directOrderProject.findUnique({
      where: {
        projectNo_bucket: {
          projectNo,
          bucket,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Direct Order project ${projectNo} already exists in ${bucket}`);
    }

    return projectNo;
  }

  private async generateNextDONumber(bucket: ProjectBucket): Promise<string> {
    // Find the highest existing DO number in this bucket
    const existingProjects = await this.prisma.directOrderProject.findMany({
      where: {
        bucket,
        projectNo: {
          startsWith: 'DO-',
        },
      },
      select: {
        projectNo: true,
      },
    });

    // Extract numbers from existing project numbers
    const existingNumbers = existingProjects
      .map(p => {
        const match = p.projectNo.match(/^DO-(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => !isNaN(num));

    // Find the next available number
    const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
    const nextNumber = maxNumber + 1;

    // Format with appropriate padding (2 digits for 1-99, then natural)
    const paddedNumber = nextNumber <= 99 ? nextNumber.toString().padStart(2, '0') : nextNumber.toString();

    return `DO-${paddedNumber}`;
  }

  private async logItemChange(
    projectId: string,
    projectItemId: string,
    field: string,
    oldValue: string | null,
    newValue: string | null,
    changedByUserId?: string
  ) {
    await this.prisma.directOrderItemChangeLog.create({
      data: {
        projectId,
        projectItemId,
        field,
        oldValue,
        newValue,
        changedByUserId,
      },
    });
  }

  // ===================== V2 PERMISSION ENFORCEMENT =====================

  /**
   * Update Direct Order item with field-level authorization
   * Same pattern as ProjectsService.updateProjectItemWithFieldAuthorization() and MissingExtraService.updateItemWithFieldAuthorization()
   */
  async updateItemWithFieldAuthorization(
    projectId: string,
    itemId: string,
    updateItemDto: UpdateDirectOrderItemDto,
    userId: string,
  ): Promise<any> {
    // Load user with role permissions
    const user = await this.prisma.user.findUnique({
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

    // ✅ V2 PERMISSION CHECK: Check if V2 is enabled for supplier-do-sheet
    const isV2Enabled = this.accessControlService.isV2Enabled('supplier-do-sheet', userId);
    if (isV2Enabled) {
      const v2Decision = await this.checkV2Permissions(userId, itemId, updateItemDto);

      // Standardized V2 logging for each field
      const userFields = Object.keys(updateItemDto).filter(field =>
        !['id', 'createdAt', 'updatedAt', 'projectId'].includes(field)
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
      const systemFields = ['id', 'createdAt', 'updatedAt', 'projectId'];
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
    return this.updateItem(projectId, itemId, updateItemDto, userId);
  }

  /**
   * Check V2 permissions for supplier-do-sheet table
   */
  private async checkV2Permissions(
    userId: string,
    itemId: string,
    updateData: any
  ): Promise<PermissionDecision> {
    try {
      const user = await this.prisma.user.findUnique({
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

      // Get column rules for supplier-do-sheet table
      const columnRules = await this.accessControlService.getSupplierColumnRulesByTableAndRole(
        'supplier-do-sheet',
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
          tableId: 'supplier-do-sheet',
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

  /**
   * Filter item by visible columns for supplier-do-sheet table
   */
  private filterItemByVisibleColumns(item: any, visibleColumns: string[]): any {
    // Always include system/relationship fields
    const systemFields = ['id', 'projectId', 'createdAt', 'updatedAt', 'vendor', 'customType', 'orderTypeRef', 'pfCode', 'vendorId', 'customTypeId', 'orderType', 'std', 'etd', 'rtd', 'rtr', 'ftd', 'rdy', 'snd', 'containerNo', 'containerDate', 'paymentRule'];

    // Direct Order specific column mapping - permission-controlled fields only
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
   * Map field names to canonical column keys for permission checking
   * Same mapping logic as ProjectsService and MissingExtraService
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
      containerNo: 'containerNo',
      type: 'type',
      pfCode: 'pfCode',
      customTypeId: 'customType',
      paymentRule: 'paymentRule',
    };

    return fieldMapping[field] || field;
  }
}