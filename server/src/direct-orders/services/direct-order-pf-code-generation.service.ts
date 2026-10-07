import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VendorsService } from '../../vendors/vendors.service';
import { CustomTypesService } from '../../custom-types/custom-types.service';
import { ProjectItemType } from '@prisma/client';

interface ItemTypeInfo {
  enumType?: ProjectItemType;
  customTypeId?: string;
  customTypeName?: string;
}

@Injectable()
export class DirectOrderPfCodeGenerationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly vendorsService: VendorsService,
    private readonly customTypesService: CustomTypesService
  ) {}

  /**
   * Generate PF Code for Direct Orders: {VENDOR_CODE}-PDO{PROJECT_NUM}-{TYPE_SHORT}{SEQ}
   * Example: YSM-PDO8-M01, ESS-PDO12-S02
   */
  async generatePfCode(
    projectId: string,
    vendorId: string,
    itemTypeInfo: ItemTypeInfo,
    orderType?: string | null
  ): Promise<string> {
    return await this.prismaService.$transaction(async (prisma) => {
      // Get Direct Order project and vendor data
      const [project, vendor] = await Promise.all([
        prisma.directOrderProject.findUnique({ where: { id: projectId } }),
        prisma.vendor.findUnique({ where: { id: vendorId } })
      ]);

      if (!project) {
        throw new NotFoundException('Direct Order project not found');
      }

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      // Extract project identifier from projectNo and create formatted version
      // Supports: "DO-8", "DO-NE-001", or any "DO-xxx" format
      const cleanProjectNo = project.projectNo.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const formattedProjectNo = cleanProjectNo.startsWith('DO') ? `P${cleanProjectNo}` : `PDO${cleanProjectNo}`;

      // Get type short code
      const typeShort = await this.getTypeShortCode(itemTypeInfo);

      // YSM/GOS vendor + MILLWORK type: fixed index based on orderType
      if (
        vendor.fixedMillworkCodes &&
        itemTypeInfo.enumType === ProjectItemType.MILLWORK &&
        orderType
      ) {
        const orderTypeName = orderType.toUpperCase().trim();
        let letter = typeShort;
        let fixedIndex: number;
        if (orderTypeName.includes('CUSTOM')) {
          fixedIndex = 3; // M03
        } else if (orderTypeName.includes('SELECTIVE')) {
          fixedIndex = 2; // M02
        } else if (orderTypeName.includes('FURNITURE')) {
          letter = 'F';
          fixedIndex = 1; // F01
        } else {
          fixedIndex = 1; // M01
        }
        return `${vendor.code}-${formattedProjectNo}-${letter}${fixedIndex.toString().padStart(2, '0')}`;
      }

      // Find highest sequence number for this combination
      const pfCodePrefix = `${vendor.code}-${formattedProjectNo}-${typeShort}`;

      const existingItems = await prisma.directOrderItem.findMany({
        where: {
          pfCode: {
            startsWith: pfCodePrefix
          }
        },
        select: { pfCode: true }
      });

      // Extract sequence numbers and find next available
      const sequenceNumbers = existingItems
        .map(item => {
          const match = item.pfCode?.match(new RegExp(`${this.escapeRegExp(pfCodePrefix)}(\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

      const nextSequence = sequenceNumbers.length > 0
        ? Math.max(...sequenceNumbers) + 1
        : 1;

      // Format sequence with leading zero
      const formattedSequence = nextSequence.toString().padStart(2, '0');

      return `${pfCodePrefix}${formattedSequence}`;
    });
  }

  /**
   * Collision-safe PF code generation with retry mechanism
   */
  async generatePfCodeSafe(
    projectId: string,
    vendorId: string,
    itemTypeInfo: ItemTypeInfo,
    maxRetries: number = 5,
    orderType?: string | null
  ): Promise<string> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const pfCode = await this.generatePfCode(projectId, vendorId, itemTypeInfo, orderType);

        // Double-check uniqueness
        const existing = await this.prismaService.directOrderItem.findFirst({
          where: { pfCode }
        });

        if (!existing) {
          return pfCode;
        }

        // If collision detected, retry
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 10 * Math.random()));
        }
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
      }
    }

    throw new Error('Failed to generate unique PF code after multiple attempts');
  }

  /**
   * Regenerate PF code for an existing Direct Order item
   */
  async regeneratePfCode(itemId: string): Promise<string | null> {
    const item = await this.prismaService.directOrderItem.findUnique({
      where: { id: itemId }
    });

    if (!item || !item.vendorId || (!item.type && !item.customTypeId)) {
      return null;
    }

    const itemTypeInfo: ItemTypeInfo = {
      enumType: item.type as ProjectItemType,
      customTypeId: item.customTypeId || undefined
    };

    return this.generatePfCodeSafe(item.projectId, item.vendorId!, itemTypeInfo, 5, item.orderType || null);
  }

  /**
   * Get type short code (M, S, C, I, F, D)
   */
  private async getTypeShortCode(itemTypeInfo: ItemTypeInfo): Promise<string> {
    // Handle enum types
    if (itemTypeInfo.enumType) {
      const typeMap: Record<ProjectItemType, string> = {
        [ProjectItemType.MILLWORK]: 'M',
        [ProjectItemType.SHELVING]: 'S',
        [ProjectItemType.CEILING]: 'C',
        [ProjectItemType.IMAGE]: 'I',
        [ProjectItemType.FURNITURE]: 'F',
        [ProjectItemType.DECORATION]: 'D'
      };

      return typeMap[itemTypeInfo.enumType] || 'X';
    }

    // Handle custom types
    if (itemTypeInfo.customTypeId) {
      const customType = await this.prismaService.customProjectType.findUnique({
        where: { id: itemTypeInfo.customTypeId },
      });
      if (customType) {
        return customType.code.charAt(0).toUpperCase();
      }
    }

    return 'X'; // Fallback
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Auto-assign PF code to Direct Order item when vendor is assigned
   */
  async autoAssignPfCodeIfNeeded(
    projectId: string,
    itemId: string,
    vendorId: string | null,
    itemType: ProjectItemType | null,
    customTypeId: string | null = null,
    orderType: string | null = null
  ): Promise<string | null> {
    if (!vendorId || (!itemType && !customTypeId)) {
      return null;
    }

    // Check if item already has a PF code
    const existingItem = await this.prismaService.directOrderItem.findUnique({
      where: { id: itemId },
      select: { pfCode: true }
    });

    if (existingItem?.pfCode && existingItem.pfCode.trim() !== '') {
      return existingItem.pfCode; // Already has PF code
    }

    // Generate new PF code
    const itemTypeInfo: ItemTypeInfo = {
      enumType: itemType,
      customTypeId: customTypeId || undefined
    };

    try {
      const pfCode = await this.generatePfCodeSafe(projectId, vendorId, itemTypeInfo, 5, orderType);

      // Update the item with the generated PF code
      await this.prismaService.directOrderItem.update({
        where: { id: itemId },
        data: { pfCode }
      });

      return pfCode;
    } catch (error) {
      console.error('Failed to auto-assign PF code:', error);
      return null;
    }
  }
}