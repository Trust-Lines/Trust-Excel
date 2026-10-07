import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface GlobalContainerDate {
  containerNo: string;
  containerDate: string | null;
  itemId: string;
  projectId: string;
  projectType: 'project' | 'directOrder' | 'missingExtra';
  itemType: string | null;
  updatedAt: string;
}

@Injectable()
export class ContainersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 🔍 GLOBAL SEARCH: Find latest container date across all projects
   */
  async findLatestContainerDate(containerNo: string): Promise<string | null> {
    if (!containerNo) return null;

    const trimmedContainerNo = containerNo.trim().toUpperCase();

    // Search all three project types for this container number
    const [projectItems, directOrderItems, missingExtraItems] = await Promise.all([
      this.prisma.projectItem.findMany({
        where: {
          containerNo: {
            equals: trimmedContainerNo,
            mode: 'insensitive'
          },
          containerDate: {
            not: null
          }
        },
        select: {
          containerDate: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }),

      this.prisma.directOrderItem.findMany({
        where: {
          containerNo: {
            equals: trimmedContainerNo,
            mode: 'insensitive'
          },
          containerDate: {
            not: null
          }
        },
        select: {
          containerDate: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }),

      this.prisma.missingExtraItem.findMany({
        where: {
          containerNo: {
            equals: trimmedContainerNo,
            mode: 'insensitive'
          },
          containerDate: {
            not: null
          }
        },
        select: {
          containerDate: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    ]);

    // Combine all results and find the most recent
    const allItems = [
      ...projectItems.map(item => ({ ...item, source: 'project' })),
      ...directOrderItems.map(item => ({ ...item, source: 'directOrder' })),
      ...missingExtraItems.map(item => ({ ...item, source: 'missingExtra' }))
    ];

    if (allItems.length === 0) {
      return null;
    }

    // Sort by updatedAt to get the most recent
    allItems.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return allItems[0].containerDate?.toISOString() || null;
  }

  /**
   * 🔄 GLOBAL SYNC: Update all items with same container number
   */
  async syncContainerDate(containerNo: string, containerDate: string | null): Promise<{
    updated: number;
    details: GlobalContainerDate[];
  }> {
    if (!containerNo) {
      return { updated: 0, details: [] };
    }

    const trimmedContainerNo = containerNo.trim().toUpperCase();
    const parsedDate = containerDate ? new Date(containerDate) : null;

    // Update all three project types
    const [projectUpdate, directOrderUpdate, missingExtraUpdate] = await Promise.all([
      this.prisma.projectItem.updateMany({
        where: {
          containerNo: {
            equals: trimmedContainerNo,
            mode: 'insensitive'
          }
        },
        data: {
          containerDate: parsedDate
        }
      }),

      this.prisma.directOrderItem.updateMany({
        where: {
          containerNo: {
            equals: trimmedContainerNo,
            mode: 'insensitive'
          }
        },
        data: {
          containerDate: parsedDate
        }
      }),

      this.prisma.missingExtraItem.updateMany({
        where: {
          containerNo: {
            equals: trimmedContainerNo,
            mode: 'insensitive'
          }
        },
        data: {
          containerDate: parsedDate
        }
      })
    ]);

    const totalUpdated = projectUpdate.count + directOrderUpdate.count + missingExtraUpdate.count;

    // Get details of updated items for logging
    const [updatedProjectItems, updatedDirectOrderItems, updatedMissingExtraItems] = await Promise.all([
      this.prisma.projectItem.findMany({
        where: {
          containerNo: {
            equals: trimmedContainerNo,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          projectId: true,
          type: true,
          containerNo: true,
          containerDate: true,
          updatedAt: true,
        }
      }),

      this.prisma.directOrderItem.findMany({
        where: {
          containerNo: {
            equals: trimmedContainerNo,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          projectId: true,
          type: true,
          containerNo: true,
          containerDate: true,
          updatedAt: true,
        }
      }),

      this.prisma.missingExtraItem.findMany({
        where: {
          containerNo: {
            equals: trimmedContainerNo,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          caseId: true,
          type: true,
          containerNo: true,
          containerDate: true,
          updatedAt: true,
        }
      })
    ]);

    const details: GlobalContainerDate[] = [
      ...updatedProjectItems.map(item => ({
        containerNo: item.containerNo || '',
        containerDate: item.containerDate?.toISOString() || null,
        itemId: item.id,
        projectId: item.projectId,
        projectType: 'project' as const,
        itemType: item.type,
        updatedAt: item.updatedAt.toISOString()
      })),
      ...updatedDirectOrderItems.map(item => ({
        containerNo: item.containerNo || '',
        containerDate: item.containerDate?.toISOString() || null,
        itemId: item.id,
        projectId: item.projectId,
        projectType: 'directOrder' as const,
        itemType: item.type,
        updatedAt: item.updatedAt.toISOString()
      })),
      ...updatedMissingExtraItems.map(item => ({
        containerNo: item.containerNo || '',
        containerDate: item.containerDate?.toISOString() || null,
        itemId: item.id,
        projectId: item.caseId, // Use caseId as projectId for missing extra
        projectType: 'missingExtra' as const,
        itemType: item.type,
        updatedAt: item.updatedAt.toISOString()
      }))
    ];

    const result = {
      updated: totalUpdated,
      details
    };

    return result;
  }

  /**
   * 📊 SEARCH: Find all containers with dates across projects
   */
  async searchContainers(containerNo?: string): Promise<GlobalContainerDate[]> {
    const whereCondition = containerNo ? {
      containerNo: {
        contains: containerNo,
        mode: 'insensitive' as const
      },
      containerDate: {
        not: null
      }
    } : {
      containerDate: {
        not: null
      }
    };

    const [projectItems, directOrderItems, missingExtraItems] = await Promise.all([
      this.prisma.projectItem.findMany({
        where: whereCondition,
        select: {
          id: true,
          projectId: true,
          type: true,
          containerNo: true,
          containerDate: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }),

      this.prisma.directOrderItem.findMany({
        where: whereCondition,
        select: {
          id: true,
          projectId: true,
          type: true,
          containerNo: true,
          containerDate: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      }),

      this.prisma.missingExtraItem.findMany({
        where: whereCondition,
        select: {
          id: true,
          caseId: true,
          type: true,
          containerNo: true,
          containerDate: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc'
        }
      })
    ]);

    const allContainers: GlobalContainerDate[] = [
      ...projectItems.map(item => ({
        containerNo: item.containerNo || '',
        containerDate: item.containerDate?.toISOString() || null,
        itemId: item.id,
        projectId: item.projectId,
        projectType: 'project' as const,
        itemType: item.type,
        updatedAt: item.updatedAt.toISOString()
      })),
      ...directOrderItems.map(item => ({
        containerNo: item.containerNo || '',
        containerDate: item.containerDate?.toISOString() || null,
        itemId: item.id,
        projectId: item.projectId,
        projectType: 'directOrder' as const,
        itemType: item.type,
        updatedAt: item.updatedAt.toISOString()
      })),
      ...missingExtraItems.map(item => ({
        containerNo: item.containerNo || '',
        containerDate: item.containerDate?.toISOString() || null,
        itemId: item.id,
        projectId: item.caseId,
        projectType: 'missingExtra' as const,
        itemType: item.type,
        updatedAt: item.updatedAt.toISOString()
      }))
    ];

    // Sort by update time (most recent first)
    return allContainers.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * 📋 List all containers from master table
   */
  async listContainers(): Promise<{ id: string; name: string }[]> {
    return this.prisma.container.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * ➕ Create a new container
   */
  async createContainer(name: string): Promise<{ id: string; name: string }> {
    const trimmed = name.trim();
    return this.prisma.container.upsert({
      where: { name: trimmed },
      update: {},
      create: { name: trimmed },
      select: { id: true, name: true },
    });
  }

  /**
   * ✏️ Rename a container - all items with containerId FK reflect change automatically
   */
  async renameContainer(
    id: string,
    newName: string,
  ): Promise<{ id: string; name: string; updatedItems: number }> {
    const trimmed = newName.trim();

    const container = await this.prisma.container.update({
      where: { id },
      data: { name: trimmed },
      select: { id: true, name: true },
    });

    // Also update legacy containerNo strings for backward compatibility
    const oldContainer = await this.prisma.container.findUnique({
      where: { id },
      select: { name: true },
    });

    // Count items referencing this container via FK
    const [p, d, m] = await Promise.all([
      this.prisma.projectItem.count({ where: { containerId: id } }),
      this.prisma.directOrderItem.count({ where: { containerId: id } }),
      this.prisma.missingExtraItem.count({ where: { containerId: id } }),
    ]);

    return {
      ...container,
      updatedItems: p + d + m,
    };
  }

  /**
   * ✏️ Rename container globally by containerNo string
   * Updates containerNo on ALL items across all 7 item tables
   */
  async renameContainerByName(
    oldName: string,
    newName: string,
  ): Promise<{ oldName: string; newName: string; updatedItems: number }> {
    const trimmedOld = oldName.trim();
    const trimmedNew = newName.trim();


    // Update containerNo string on all item tables
    const [p, d, m, te, ep, edo, eme] = await Promise.all([
      this.prisma.projectItem.updateMany({
        where: { containerNo: { equals: trimmedOld, mode: 'insensitive' } },
        data: { containerNo: trimmedNew },
      }),
      this.prisma.directOrderItem.updateMany({
        where: { containerNo: { equals: trimmedOld, mode: 'insensitive' } },
        data: { containerNo: trimmedNew },
      }),
      this.prisma.missingExtraItem.updateMany({
        where: { containerNo: { equals: trimmedOld, mode: 'insensitive' } },
        data: { containerNo: trimmedNew },
      }),
      this.prisma.trustExpenseItem.updateMany({
        where: { containerNo: { equals: trimmedOld, mode: 'insensitive' } },
        data: { containerNo: trimmedNew },
      }),
      this.prisma.expensesPItem.updateMany({
        where: { containerNo: { equals: trimmedOld, mode: 'insensitive' } },
        data: { containerNo: trimmedNew },
      }),
      this.prisma.expensesDirectOrderItem.updateMany({
        where: { containerNo: { equals: trimmedOld, mode: 'insensitive' } },
        data: { containerNo: trimmedNew },
      }),
      this.prisma.expensesMissingExtraItem.updateMany({
        where: { containerNo: { equals: trimmedOld, mode: 'insensitive' } },
        data: { containerNo: trimmedNew },
      }),
    ]);

    const totalUpdated = p.count + d.count + m.count + te.count + ep.count + edo.count + eme.count;

    // Also update Container master table if entry exists
    const existingMaster = await this.prisma.container.findFirst({
      where: { name: { equals: trimmedOld, mode: 'insensitive' } },
    });
    if (existingMaster) {
      await this.prisma.container.update({
        where: { id: existingMaster.id },
        data: { name: trimmedNew },
      });
    }

    return { oldName: trimmedOld, newName: trimmedNew, updatedItems: totalUpdated };
  }

  /**
   * 📋 Get all unique container names currently in use across all item tables
   */
  async getUniqueContainerNames(): Promise<string[]> {
    const [pItems, dItems, mItems] = await Promise.all([
      this.prisma.projectItem.findMany({
        where: { containerNo: { not: null } },
        select: { containerNo: true },
        distinct: ['containerNo'],
      }),
      this.prisma.directOrderItem.findMany({
        where: { containerNo: { not: null } },
        select: { containerNo: true },
        distinct: ['containerNo'],
      }),
      this.prisma.missingExtraItem.findMany({
        where: { containerNo: { not: null } },
        select: { containerNo: true },
        distinct: ['containerNo'],
      }),
    ]);

    const allNames = new Set<string>();
    [...pItems, ...dItems, ...mItems].forEach(item => {
      if (item.containerNo) allNames.add(item.containerNo);
    });

    return Array.from(allNames).sort();
  }
}