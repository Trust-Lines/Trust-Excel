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
export class PfCodeGenerationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly vendorsService: VendorsService,
    private readonly customTypesService: CustomTypesService
  ) {}

  /**
   * Generate PF Code: {VENDOR_CODE}-{PROJECT_NO}-{TYPE_SHORT}{SEQ}
   * Example: PMS-P001-M01, ESS-P002-S02
   */
  async generatePfCode(
    projectId: string,
    vendorId: string,
    itemTypeInfo: ItemTypeInfo,
    orderType?: string | null
  ): Promise<string> {
    return await this.prismaService.$transaction(async (prisma) => {
      // Get project and vendor data
      const [project, vendor] = await Promise.all([
        prisma.project.findUnique({ where: { id: projectId } }),
        prisma.vendor.findUnique({ where: { id: vendorId } })
      ]);

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      // Get type short code
      const typeShort = await this.getTypeShortCode(itemTypeInfo);

      // YSM / GOS + MILLWORK: fixed code based on orderType
      if (vendor.fixedMillworkCodes && itemTypeInfo.enumType === ProjectItemType.MILLWORK && orderType) {
        const orderTypeName = orderType.toUpperCase().trim();
        let letter = typeShort; // default M
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
        return `${vendor.code}-${project.projectNo}-${letter}${fixedIndex.toString().padStart(2, '0')}`;
      }

      // Find highest sequence number for this combination
      const pfCodePrefix = `${vendor.code}-${project.projectNo}-${typeShort}`;

      const existingItems = await prisma.projectItem.findMany({
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
    orderType?: string | null,
    currentItemId?: string
  ): Promise<string> {
    // YSM + MILLWORK fixed codes: skip uniqueness check (same code is expected for same orderType)
    if (orderType && itemTypeInfo.enumType === ProjectItemType.MILLWORK) {
      const vendor = await this.prismaService.vendor.findUnique({ where: { id: vendorId }, select: { fixedMillworkCodes: true } });
      if (vendor?.fixedMillworkCodes) {
        return this.generatePfCode(projectId, vendorId, itemTypeInfo, orderType);
      }
    }

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const pfCode = await this.generatePfCode(projectId, vendorId, itemTypeInfo, orderType);

        // Double-check uniqueness (exclude current item being updated)
        const existing = await this.prismaService.projectItem.findFirst({
          where: {
            pfCode,
            ...(currentItemId ? { id: { not: currentItemId } } : {}),
          }
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
   * Get type short code for PF code generation
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
        return customType.code;
      }
    }

    // Fallback: generate code from custom type name
    if (itemTypeInfo.customTypeName) {
      return this.generateCodeFromName(itemTypeInfo.customTypeName);
    }

    return 'X'; // Default fallback
  }

  /**
   * Generate a short code from a type name
   */
  private generateCodeFromName(name: string): string {
    const cleaned = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (cleaned.length <= 3) {
      return cleaned;
    }

    // Take first letter of each word or first 3 characters
    const words = name.trim().toUpperCase().split(/\s+/);
    if (words.length > 1) {
      return words.map(w => w.charAt(0)).join('').substring(0, 3);
    }

    return cleaned.substring(0, 3);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generate PF code for existing project item (useful for migration/updates)
   */
  async regeneratePfCode(itemId: string): Promise<string | null> {
    const item = await this.prismaService.projectItem.findUnique({
      where: { id: itemId },
      include: {
        project: true,
        vendor: true,
        customType: true
      }
    });

    if (!item || !item.vendor) {
      return null;
    }

    // Prepare type info
    const itemTypeInfo: ItemTypeInfo = {
      enumType: item.type || undefined,
      customTypeId: item.customTypeId || undefined,
      customTypeName: item.customType?.name
    };

    return this.generatePfCodeSafe(item.projectId, item.vendorId!, itemTypeInfo);
  }

  /**
   * Validate PF code format
   */
  validatePfCodeFormat(pfCode: string): boolean {
    // Format: {VENDOR_CODE}-{PROJECT_NO}-{TYPE_SHORT}{SEQ}
    // Example: PMS-P001-M01
    const pfCodeRegex = /^[A-Z0-9]{2,10}-P\d+-[A-Z]\d{2}$/;
    return pfCodeRegex.test(pfCode);
  }

  /**
   * Parse PF code components
   */
  parsePfCode(pfCode: string): {
    vendorCode: string;
    projectNo: string;
    typeShort: string;
    sequence: number;
  } | null {
    const match = pfCode.match(/^([A-Z0-9]{2,10})-(P\d+)-([A-Z])(\d{2})$/);

    if (!match) {
      return null;
    }

    return {
      vendorCode: match[1],
      projectNo: match[2],
      typeShort: match[3],
      sequence: parseInt(match[4], 10)
    };
  }
}