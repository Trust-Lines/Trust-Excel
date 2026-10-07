import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { applyStatusDateAutomation } from '../common/helpers/status-date-automation';
import { TypeVisibilityService } from '../permissions/services/type-visibility.service';
import { ProjectScopeService } from '../permissions/services/project-scope.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateExpensesMEProjectDto } from './dto/create-expenses-me-project.dto';
import { CreateExpensesMEItemDto } from './dto/create-expenses-me-item.dto';
import { UpdateExpensesMEItemDto } from './dto/update-expenses-me-item.dto';

const ITEM_INCLUDE = {
  vendor: { select: { id: true, code: true, name: true } },
  customType: { select: { id: true, name: true, code: true, description: true } },
};

const PROJECT_INCLUDE = {
  items: {
    where: { deletedAt: null },
    include: ITEM_INCLUDE,
    orderBy: { createdAt: 'asc' as const },
  },
};

@Injectable()
export class ExpensesMissingExtraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly typeVisibilityService: TypeVisibilityService,
    private readonly projectScopeService: ProjectScopeService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  // ==================== PROJECT CRUD ====================

  async findAllProjects(user?: any) {
    let projectWhere: any = {};
    if (user?.roleId) {
      const refs = await this.projectScopeService.getAssignedProjectRefs(user.roleId);
      if (refs !== null) {
        projectWhere.projectNo = { in: refs.map(r => r.projectNo) };
      }
    }

    const projects = await this.prisma.expensesMissingExtraProject.findMany({
      where: { ...projectWhere, deletedAt: null },
      include: {
        items: {
          include: ITEM_INCLUDE,
          orderBy: { createdAt: 'asc' as const },
        },
      },
      orderBy: [{ bucket: 'asc' }, { projectNo: 'asc' }],
    });

    return { data: projects };
  }

  async createProject(dto: CreateExpensesMEProjectDto, userId?: string) {
    const existing = await this.prisma.expensesMissingExtraProject.findFirst({
      where: { projectNo: dto.projectNo.trim(), bucket: dto.bucket },
    });

    if (existing) {
      throw new BadRequestException(
        'A project with this Project No already exists in this region',
      );
    }

    const project = await this.prisma.expensesMissingExtraProject.create({
      data: {
        bucket: dto.bucket,
        projectNo: dto.projectNo.trim(),
        name: dto.name,
      },
      include: PROJECT_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['expenses-me', 'dashboard'], 'expenses-me-project:created', { project }, userId);
    return project;
  }

  async updateProject(projectId: string, dto: any, userId?: string) {
    const project = await this.prisma.expensesMissingExtraProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Expenses Missing & Extra project not found');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.types !== undefined) updateData.types = dto.types;
    if (dto.isUrgent !== undefined) updateData.isUrgent = dto.isUrgent;

    const updated = await this.prisma.expensesMissingExtraProject.update({
      where: { id: projectId },
      data: updateData,
      include: PROJECT_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['expenses-me', 'dashboard'], 'expenses-me-project:updated', { project: updated }, userId);
    return updated;
  }

  async moveRegion(projectId: string, bucket: string, userId?: string) {
    const project = await this.prisma.expensesMissingExtraProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Expenses Missing & Extra project not found');
    }

    const moved = await this.prisma.expensesMissingExtraProject.update({
      where: { id: projectId },
      data: { bucket: bucket as any },
      include: PROJECT_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['expenses-me', 'dashboard'], 'expenses-me-project:updated', { project: moved }, userId);
    return moved;
  }

  async deleteProject(projectId: string, userId?: string) {
    const project = await this.prisma.expensesMissingExtraProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Expenses Missing & Extra project not found');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.expensesMissingExtraProject.update({ where: { id: projectId }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'ExpensesMissingExtraProject',
          entityId: projectId,
          entityLabel: `${project.name} (${project.projectNo})`,
          moduleGroup: 'expenses-missing-extra',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);
    this.eventsGateway.emitToRooms(['expenses-me', 'dashboard'], 'expenses-me-project:deleted', { projectId }, userId);
    return { message: 'Project deleted successfully' };
  }

  // ==================== ITEM CRUD ====================

  async createItem(projectId: string, dto: CreateExpensesMEItemDto, userId?: string) {
    const project = await this.prisma.expensesMissingExtraProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Expenses Missing & Extra project not found');
    }

    const initialStatus = dto.status ?? 'NOT_ORDERED';

    // Generate PF code if vendor is provided
    let pfCode: string | null = null;
    if (dto.vendorId) {
      try {
        pfCode = await this.generatePfCodeForItem(project.projectNo, dto.vendorId, dto.type || null, dto.orderType || null);
      } catch (error) {
        console.error('Failed to generate PF code for new expenses ME item:', error);
      }
    }

    const item = await this.prisma.expensesMissingExtraItem.create({
      data: {
        projectId,
        type: dto.type || null,
        customTypeId: dto.customTypeId || null,
        vendorId: dto.vendorId || null,
        orderType: dto.orderType || null,
        pfCode,
        status: initialStatus,
        std: initialStatus === 'ORDERED' ? new Date() : null,
        etd: dto.etd ? new Date(dto.etd) : null,
        rtrd: initialStatus === 'READY_TO_RECEIVE' ? new Date() : (dto.rtrd ? new Date(dto.rtrd) : null),
        ftd: initialStatus === 'SENT_TO_TLINES' ? new Date() : (dto.ftd ? new Date(dto.ftd) : null),
        expensesUsd: dto.expensesUsd ?? null,
        expensesTl: dto.expensesTl ?? null,
        shelvesLoc: dto.shelvesLoc || null,
        containerNo: dto.containerNo || null,
        invoiceSit: dto.invoiceSit || null,
        paymentRule: dto.paymentRule || null,
      },
      include: ITEM_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['expenses-me', 'dashboard'], 'expenses-me-item:created', { item, projectId }, userId);
    return item;
  }

  async updateItem(itemId: string, dto: UpdateExpensesMEItemDto, userId?: string) {
    const item = await this.prisma.expensesMissingExtraItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Expenses Missing & Extra item not found');
    }

    const updateData: any = {};

    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.customTypeId !== undefined) updateData.customTypeId = dto.customTypeId || null;
    if (dto.vendorId !== undefined) updateData.vendorId = dto.vendorId || null;
    if (dto.orderType !== undefined) updateData.orderType = dto.orderType;

    // Handle PF code generation only if item doesn't already have one
    const vendorChanged = dto.vendorId !== undefined && dto.vendorId !== item.vendorId;
    const typeChanged = dto.type !== undefined && dto.type !== item.type;
    const orderTypeChanged = dto.orderType !== undefined && dto.orderType !== item.orderType;
    if ((vendorChanged || typeChanged || orderTypeChanged) && (!item.pfCode || orderTypeChanged)) {
      const effectiveVendorId = dto.vendorId !== undefined ? dto.vendorId : item.vendorId;
      const effectiveType = dto.type !== undefined ? dto.type : item.type;
      const effectiveOrderType = dto.orderType !== undefined ? dto.orderType : item.orderType;
      if (effectiveVendorId) {
        try {
          const project = await this.prisma.expensesMissingExtraProject.findUnique({ where: { id: item.projectId } });
          if (project) {
            const newPfCode = await this.generatePfCodeForItem(project.projectNo, effectiveVendorId, effectiveType, effectiveOrderType);
            updateData.pfCode = newPfCode;
          }
        } catch (error) {
          console.error('Failed to generate PF code for expenses ME item:', error);
        }
      }
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;

      // Status-driven date automation (shared helper)
      const dateUpdates = applyStatusDateAutomation(
        item.status,
        dto.status,
        item,
        { rtrField: 'rtrd', hasRtd: false },
      );
      Object.assign(updateData, dateUpdates);
    }

    if (dto.std !== undefined) updateData.std = dto.std ? new Date(dto.std) : null;
    if (dto.etd !== undefined) updateData.etd = dto.etd ? new Date(dto.etd) : null;
    if (dto.rtrd !== undefined) updateData.rtrd = dto.rtrd ? new Date(dto.rtrd) : null;
    if (dto.ftd !== undefined) updateData.ftd = dto.ftd ? new Date(dto.ftd) : null;
    if (dto.expensesUsd !== undefined) updateData.expensesUsd = dto.expensesUsd;
    if (dto.expensesTl !== undefined) updateData.expensesTl = dto.expensesTl;
    if (dto.shelvesLoc !== undefined) updateData.shelvesLoc = dto.shelvesLoc;
    if (dto.containerNo !== undefined) updateData.containerNo = dto.containerNo;
    if (dto.invoiceSit !== undefined) updateData.invoiceSit = dto.invoiceSit;
    if (dto.paidUsd1 !== undefined) updateData.paidUsd1 = dto.paidUsd1;
    if (dto.paidUsd2 !== undefined) updateData.paidUsd2 = dto.paidUsd2;
    if (dto.paidTl1 !== undefined) updateData.paidTl1 = dto.paidTl1;
    if (dto.paidTl2 !== undefined) updateData.paidTl2 = dto.paidTl2;
    if (dto.invoiceTransactionNo !== undefined) updateData.invoiceTransactionNo = dto.invoiceTransactionNo;
    if (dto.invoiceNumber !== undefined) updateData.invoiceNumber = dto.invoiceNumber;
    if (dto.quickBook !== undefined) updateData.quickBook = dto.quickBook;
    if (dto.statusNote !== undefined) updateData.statusNote = dto.statusNote;
    if (dto.paymentRule !== undefined) updateData.paymentRule = dto.paymentRule;
    if (dto.priceNotes !== undefined) updateData.priceNotes = dto.priceNotes;

    const updated = await this.prisma.expensesMissingExtraItem.update({
      where: { id: itemId },
      data: updateData,
      include: ITEM_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['expenses-me', 'dashboard'], 'expenses-me-item:updated', { item: updated }, userId);

    // Patch-based event
    if (userId) {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(dto)) {
        if (['id', 'createdAt', 'projectId'].includes(key)) continue;
        const val = (updated as any)[key];
        patch[key] = val instanceof Date ? val.toISOString() : val;
      }
      // Include pfCode if it was auto-generated
      if (updateData.pfCode !== undefined && !('pfCode' in patch)) {
        patch.pfCode = updated.pfCode;
      }
      // Include all auto-generated date fields from status automation
      for (const df of ['std', 'etd', 'rtrd', 'rtd', 'rdy', 'ftd', 'snd']) {
        if (!(df in patch)) {
          const val = (updated as any)[df];
          patch[df] = val instanceof Date ? val.toISOString() : val ?? null;
        }
      }
      this.eventsGateway.emitPatchEvent(['expenses-me', 'dashboard'], {
        entity: 'expensesMEItem',
        entityId: itemId,
        parentId: item.projectId,
        patch,
        updatedAt: (updated as any).updatedAt?.toISOString?.() || new Date().toISOString(),
        updatedBy: userId,
        mutationId: EventsGateway.generateMutationId(),
      });
    }

    return updated;
  }

  async deleteItem(itemId: string, userId?: string) {
    const item = await this.prisma.expensesMissingExtraItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Expenses Missing & Extra item not found');
    }

    const { projectId } = item;
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.expensesMissingExtraItem.update({ where: { id: itemId }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'ExpensesMissingExtraItem',
          entityId: itemId,
          entityLabel: `${item.type || 'Custom'} item`,
          moduleGroup: 'expenses-missing-extra-items',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          parentId: item.projectId,
        },
      }),
    ]);
    this.eventsGateway.emitToRooms(['expenses-me', 'dashboard'], 'expenses-me-item:deleted', { itemId, projectId }, userId);
    return { message: 'Item deleted successfully' };
  }

  private async generatePfCodeForItem(projectNo: string, vendorId: string, type: string | null, orderType: string | null): Promise<string> {
    const vendor = await this.prisma.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor) throw new Error('Vendor not found');

    const typeLetters: Record<string, string> = {
      'MILLWORK': 'M',
      'SHELVING': 'S',
      'CEILING': 'C',
      'IMAGE': 'I',
      'FURNITURE': 'F',
    };
    const typeLetter = (type && typeLetters[type]) || 'X';

    // YSM/GOS vendor + MILLWORK type: fixed code based on orderType
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
      return `${vendor.code}-${projectNo}-${letter}${indexStr}`;
    }

    // Default: auto-increment logic
    const existingItems = await this.prisma.expensesMissingExtraItem.findMany({
      where: {
        project: { projectNo },
        type: type as any,
        vendorId,
      },
      orderBy: { pfCode: 'asc' },
    });

    let nextIndex = 1;
    if (existingItems.length > 0) {
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
    return `${vendor.code}-${projectNo}-${typeLetter}${indexStr}`;
  }
}
