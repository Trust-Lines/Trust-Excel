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
import { CreateExpensesDOProjectDto } from './dto/create-expenses-do-project.dto';
import { CreateExpensesDOItemDto } from './dto/create-expenses-do-item.dto';
import { UpdateExpensesDOItemDto } from './dto/update-expenses-do-item.dto';

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
export class ExpensesDirectOrderService {
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

    const projects = await this.prisma.expensesDirectOrderProject.findMany({
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

  async createProject(dto: CreateExpensesDOProjectDto, userId?: string) {
    const existing = await this.prisma.expensesDirectOrderProject.findFirst({
      where: { projectNo: dto.projectNo.trim(), bucket: dto.bucket },
    });

    if (existing) {
      throw new BadRequestException(
        'A project with this Project No already exists in this region',
      );
    }

    const project = await this.prisma.expensesDirectOrderProject.create({
      data: {
        bucket: dto.bucket,
        projectNo: dto.projectNo.trim(),
        name: dto.name,
      },
      include: PROJECT_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['expenses-do', 'dashboard'], 'expenses-do-project:created', { project }, userId);
    return project;
  }

  async updateProject(projectId: string, dto: any, userId?: string) {
    const project = await this.prisma.expensesDirectOrderProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Expenses Direct Order project not found');
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.types !== undefined) updateData.types = dto.types;
    if (dto.isUrgent !== undefined) updateData.isUrgent = dto.isUrgent;

    const updated = await this.prisma.expensesDirectOrderProject.update({
      where: { id: projectId },
      data: updateData,
      include: PROJECT_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['expenses-do', 'dashboard'], 'expenses-do-project:updated', { project: updated }, userId);
    return updated;
  }

  async moveRegion(projectId: string, bucket: string, userId?: string) {
    const project = await this.prisma.expensesDirectOrderProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Expenses Direct Order project not found');
    }

    const moved = await this.prisma.expensesDirectOrderProject.update({
      where: { id: projectId },
      data: { bucket: bucket as any },
      include: PROJECT_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['expenses-do', 'dashboard'], 'expenses-do-project:updated', { project: moved }, userId);
    return moved;
  }

  async deleteProject(projectId: string, userId?: string) {
    const project = await this.prisma.expensesDirectOrderProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Expenses Direct Order project not found');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.expensesDirectOrderProject.update({ where: { id: projectId }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'ExpensesDirectOrderProject',
          entityId: projectId,
          entityLabel: `${project.name} (${project.projectNo})`,
          moduleGroup: 'expenses-direct-order',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);
    this.eventsGateway.emitToRooms(['expenses-do', 'dashboard'], 'expenses-do-project:deleted', { projectId }, userId);
    return { message: 'Project deleted successfully' };
  }

  // ==================== ITEM CRUD ====================

  async createItem(projectId: string, dto: CreateExpensesDOItemDto, userId?: string) {
    const project = await this.prisma.expensesDirectOrderProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Expenses Direct Order project not found');
    }

    const initialStatus = dto.status || 'NOT_ORDERED';

    const item = await this.prisma.expensesDirectOrderItem.create({
      data: {
        projectId,
        type: dto.type || null,
        customTypeId: dto.customTypeId || null,
        vendorId: dto.vendorId || null,
        orderType: dto.orderType || null,
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

    this.eventsGateway.emitToRooms(['expenses-do', 'dashboard'], 'expenses-do-item:created', { item, projectId }, userId);
    return item;
  }

  async updateItem(itemId: string, dto: UpdateExpensesDOItemDto, userId?: string) {
    const item = await this.prisma.expensesDirectOrderItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Expenses Direct Order item not found');
    }

    const updateData: any = {};

    if (dto.type !== undefined) updateData.type = dto.type;
    if (dto.customTypeId !== undefined) updateData.customTypeId = dto.customTypeId || null;
    if (dto.vendorId !== undefined) updateData.vendorId = dto.vendorId || null;
    if (dto.orderType !== undefined) updateData.orderType = dto.orderType;

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

    const updated = await this.prisma.expensesDirectOrderItem.update({
      where: { id: itemId },
      data: updateData,
      include: ITEM_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['expenses-do', 'dashboard'], 'expenses-do-item:updated', { item: updated }, userId);

    // Patch-based event
    if (userId) {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(dto)) {
        if (['id', 'createdAt', 'projectId'].includes(key)) continue;
        const val = (updated as any)[key];
        patch[key] = val instanceof Date ? val.toISOString() : val;
      }
      // Include all auto-generated date fields from status automation
      for (const df of ['std', 'etd', 'rtrd', 'rtd', 'rdy', 'ftd', 'snd']) {
        if (!(df in patch)) {
          const val = (updated as any)[df];
          patch[df] = val instanceof Date ? val.toISOString() : val ?? null;
        }
      }
      this.eventsGateway.emitPatchEvent(['expenses-do', 'dashboard'], {
        entity: 'expensesDOItem',
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
    const item = await this.prisma.expensesDirectOrderItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Expenses Direct Order item not found');
    }

    const { projectId } = item;
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.expensesDirectOrderItem.update({ where: { id: itemId }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'ExpensesDirectOrderItem',
          entityId: itemId,
          entityLabel: `${item.type || 'Custom'} item`,
          moduleGroup: 'expenses-direct-order-items',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          parentId: item.projectId,
        },
      }),
    ]);
    this.eventsGateway.emitToRooms(['expenses-do', 'dashboard'], 'expenses-do-item:deleted', { itemId, projectId }, userId);
    return { message: 'Item deleted successfully' };
  }
}
