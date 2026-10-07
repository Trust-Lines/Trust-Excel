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
import { CreateTrustExpenseProjectDto } from './dto/create-trust-expense-project.dto';
import { CreateTrustExpenseItemDto, UpdateTrustExpenseItemDto, ReorderTrustExpenseItemsDto } from './dto/update-trust-expense-item.dto';

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

const TE_DEFAULT_PROJECT_NO = 'TE-DEFAULT';

@Injectable()
export class TrustExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly typeVisibilityService: TypeVisibilityService,
    private readonly projectScopeService: ProjectScopeService,
    private readonly eventsGateway: EventsGateway,
  ) { }

  // ==================== PROJECT CRUD ====================

  async createProject(dto: CreateTrustExpenseProjectDto, userId?: string) {
    const existing = await this.prisma.trustExpenseProject.findFirst({
      where: { projectNo: dto.projectNo.trim(), bucket: dto.bucket },
    });

    if (existing) {
      throw new BadRequestException(
        'A trust expense project with this Project No already exists in this bucket',
      );
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const project = await prisma.trustExpenseProject.create({
        data: {
          bucket: dto.bucket,
          projectNo: dto.projectNo.trim(),
          name: dto.name,
          address: dto.address || '',
          description: dto.description,
          types: dto.types || [],
          isUrgent: dto.isUrgent || false,
          containerDate: dto.containerDate ? new Date(dto.containerDate) : undefined,
        },
      });

      // Create placeholder items for selected types
      if (dto.types && dto.types.length > 0) {
        const enumTypes = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];

        for (const typeName of dto.types) {
          const normalized = typeName.trim().toUpperCase();
          if (enumTypes.includes(normalized)) {
            await prisma.trustExpenseItem.create({
              data: {
                projectId: project.id,
                type: normalized as any,
                status: 'NOT_ORDERED',
              },
            });
          }
        }
      }

      return prisma.trustExpenseProject.findUnique({
        where: { id: project.id },
        include: PROJECT_INCLUDE,
      });
    });

    this.eventsGateway.emitToRooms(['trust-expenses', 'dashboard'], 'trust-expense-project:created', { project: result }, userId);
    return result;
  }

  async findAllProjects(user?: any) {
    // Project scope filter (match by projectNo)
    let projectWhere: any = {};
    if (user?.roleId) {
      const refs = await this.projectScopeService.getAssignedProjectRefs(user.roleId);
      if (refs !== null) {
        projectWhere.projectNo = { in: refs.map(r => r.projectNo) };
      }
    }

    const projects = await this.prisma.trustExpenseProject.findMany({
      where: { ...projectWhere, deletedAt: null },
      include: {
        items: {
          include: ITEM_INCLUDE,
          orderBy: { createdAt: 'asc' as const },
        },
      },
      orderBy: [{ bucket: 'asc' }, { projectNo: 'asc' }],
    });

    return {
      data: projects,
      meta: {
        total: projects.length,
        page: 1,
        limit: projects.length,
        totalPages: 1,
      },
    };
  }

  async findOneProject(id: string) {
    const project = await this.prisma.trustExpenseProject.findUnique({
      where: { id },
      include: PROJECT_INCLUDE,
    });

    if (!project) {
      throw new NotFoundException('Trust expense project not found');
    }

    return project;
  }

  // ==================== FLAT ITEM LIST ====================

  async findAllItems(user?: any) {
    const items = await this.prisma.trustExpenseItem.findMany({
      where: { deletedAt: null },
      include: ITEM_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return items;
  }

  private async getOrCreateDefaultProject(): Promise<string> {
    let project = await this.prisma.trustExpenseProject.findFirst({
      where: { projectNo: TE_DEFAULT_PROJECT_NO },
    });

    if (!project) {
      project = await this.prisma.trustExpenseProject.create({
        data: {
          bucket: 'TLINES_NE',
          projectNo: TE_DEFAULT_PROJECT_NO,
          name: 'Trust Expense Default',
          address: '',
          types: [],
        },
      });
    }

    return project.id;
  }

  async createItemDirect(dto: CreateTrustExpenseItemDto, userId?: string) {
    const projectId = await this.getOrCreateDefaultProject();

    // Calculate sortOrder: find max and add 1000
    const maxItem = await this.prisma.trustExpenseItem.findFirst({
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    const nextSortOrder = dto.sortOrder ?? ((maxItem?.sortOrder ?? 0) + 1000);

    const item = await this.prisma.trustExpenseItem.create({
      data: {
        projectId,
        type: dto.type || null,
        customTypeId: dto.customTypeId || null,
        vendorId: dto.vendorId || null,
        orderType: dto.orderType || null,
        status: dto.status || 'NOT_ORDERED',
        std: dto.std ? new Date(dto.std) : new Date(),
        etd: dto.etd ? new Date(dto.etd) : null,
        rtrd: dto.rtrd ? new Date(dto.rtrd) : null,
        ftd: dto.ftd ? new Date(dto.ftd) : null,
        expensesUsd: dto.expensesUsd ?? null,
        expensesTl: dto.expensesTl ?? null,
        shelvesLocation: dto.shelvesLocation || null,
        containerNo: dto.containerNo || null,
        invoice: dto.invoice || null,
        paymentRule: dto.paymentRule || null,
        colorHex: dto.colorHex || null,
        sortOrder: nextSortOrder,
        teType: dto.teType || null,
      },
      include: ITEM_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['trust-expenses', 'dashboard'], 'trust-expense-item:created', { item }, userId);
    return item;
  }

  async reorderItems(dto: ReorderTrustExpenseItemsDto, userId?: string) {
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.trustExpenseItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    this.eventsGateway.emitToRooms(['trust-expenses'], 'trust-expense-item:reordered', { items: dto.items }, userId);
    return { message: 'Reorder successful', count: dto.items.length };
  }

  // ==================== ITEM CRUD ====================

  async createItem(projectId: string, dto: CreateTrustExpenseItemDto, userId?: string) {
    const project = await this.prisma.trustExpenseProject.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Trust expense project not found');
    }

    const item = await this.prisma.trustExpenseItem.create({
      data: {
        projectId,
        type: dto.type || null,
        customTypeId: dto.customTypeId || null,
        vendorId: dto.vendorId || null,
        orderType: dto.orderType || null,
        status: dto.status || 'NOT_ORDERED',
        std: dto.std ? new Date(dto.std) : null,
        etd: dto.etd ? new Date(dto.etd) : null,
        rtrd: dto.rtrd ? new Date(dto.rtrd) : null,
        ftd: dto.ftd ? new Date(dto.ftd) : null,
        expensesUsd: dto.expensesUsd ?? null,
        expensesTl: dto.expensesTl ?? null,
        shelvesLocation: dto.shelvesLocation || null,
        containerNo: dto.containerNo || null,
        invoice: dto.invoice || null,
        paymentRule: dto.paymentRule || null,
        colorHex: dto.colorHex || null,
        sortOrder: dto.sortOrder ?? 0,
        teType: dto.teType || null,
      },
      include: ITEM_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['trust-expenses', 'dashboard'], 'trust-expense-item:created', { item, projectId }, userId);
    return item;
  }

  async updateItem(itemId: string, dto: UpdateTrustExpenseItemDto, userId?: string) {
    const item = await this.prisma.trustExpenseItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Trust expense item not found');
    }

    // Build update data - only include fields that are explicitly provided
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
    if (dto.shelvesLocation !== undefined) updateData.shelvesLocation = dto.shelvesLocation;
    if (dto.containerNo !== undefined) updateData.containerNo = dto.containerNo;
    if (dto.invoice !== undefined) updateData.invoice = dto.invoice;
    if (dto.paidUsd1 !== undefined) updateData.paidUsd1 = dto.paidUsd1;
    if (dto.paidUsd2 !== undefined) updateData.paidUsd2 = dto.paidUsd2;
    if (dto.paidTl1 !== undefined) updateData.paidTl1 = dto.paidTl1;
    if (dto.paidTl2 !== undefined) updateData.paidTl2 = dto.paidTl2;
    if (dto.invoiceTransactionNo !== undefined) updateData.invoiceTransactionNo = dto.invoiceTransactionNo;
    if (dto.invoiceNumber !== undefined) updateData.invoiceNumber = dto.invoiceNumber;
    if (dto.quickBook !== undefined) updateData.quickBook = dto.quickBook;
    if (dto.paymentRule !== undefined) updateData.paymentRule = dto.paymentRule;
    if (dto.colorHex !== undefined) updateData.colorHex = dto.colorHex;
    if (dto.sortOrder !== undefined) updateData.sortOrder = dto.sortOrder;
    if (dto.teType !== undefined) updateData.teType = dto.teType;

    const updated = await this.prisma.trustExpenseItem.update({
      where: { id: itemId },
      data: updateData,
      include: ITEM_INCLUDE,
    });

    this.eventsGateway.emitToRooms(['trust-expenses', 'dashboard'], 'trust-expense-item:updated', { item: updated }, userId);

    // Patch-based event
    if (userId) {
      const patch: Record<string, any> = {};
      for (const key of Object.keys(dto)) {
        if (['id', 'createdAt', 'projectId'].includes(key)) continue;
        const val = (updated as any)[key];
        patch[key] = val instanceof Date ? val.toISOString() : val;
      }
      this.eventsGateway.emitPatchEvent(['trust-expenses', 'dashboard'], {
        entity: 'trustExpenseItem',
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
    const item = await this.prisma.trustExpenseItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Trust expense item not found');
    }

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.trustExpenseItem.update({ where: { id: itemId }, data: { deletedAt: now } }),
      this.prisma.trashBin.create({
        data: {
          entityType: 'TrustExpenseItem',
          entityId: itemId,
          entityLabel: `${item.teType || item.type || 'TE item'}`,
          moduleGroup: 'trust-expense-items',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          parentId: item.projectId,
        },
      }),
    ]);
    this.eventsGateway.emitToRooms(['trust-expenses', 'dashboard'], 'trust-expense-item:deleted', { itemId }, userId);
    return { message: 'Trust expense item deleted successfully' };
  }
}
