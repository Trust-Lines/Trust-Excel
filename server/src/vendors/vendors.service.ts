import { Injectable, BadRequestException, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { AuditLogService } from '../audit-log/audit-log.service';
import { Vendor } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) { }


  /**
   * Get all active vendors for current tenant with optional search
   */
  async findAll(q?: string): Promise<Vendor[]> {
    const where: any = {
      isActive: true,
    };

    // Add search functionality
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prismaService.vendor.findMany({
      where,
      orderBy: [{ code: 'asc' }, { name: 'asc' }], // Sort by code first (YSM, CBN, etc.)
    });
  }

  /**
   * Get a single vendor by ID
   */
  async findOne(id: string): Promise<Vendor> {
    if (!id) {
      throw new BadRequestException('Vendor ID is required');
    }

    const vendor = await this.prismaService.vendor.findUnique({
      where: { id },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  /**
   * Find vendor by code (tenant-scoped)
   */
  async findByCode(code: string): Promise<Vendor | null> {
    if (!code) {
      return null;
    }

    return this.prismaService.vendor.findFirst({
      where: {
        code: code.toUpperCase()
      },
    });
  }

  /**
   * Find vendor by name (tenant-scoped)
   */
  async findByName(name: string): Promise<Vendor | null> {
    if (!name) {
      return null;
    }

    return this.prismaService.vendor.findFirst({
      where: {
        name: { equals: name.trim(), mode: 'insensitive' }
      },
    });
  }

  /**
   * Create a new vendor with manual code (tenant-scoped)
   */
  async create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    const { name, code } = createVendorDto;
    const vendorCode = code.toUpperCase(); // Manual codes only (YSM, CBN, etc.)
    const vendorName = name.trim();

    // Check if vendor code already exists for this tenant
    const existingByCode = await this.findByCode(vendorCode);
    if (existingByCode) {
      throw new ConflictException(`A vendor with code '${vendorCode}' already exists`);
    }

    // Check if vendor name already exists for this tenant
    const existingByName = await this.findByName(vendorName);
    if (existingByName) {
      throw new ConflictException(`A vendor with name '${vendorName}' already exists`);
    }

    const vendor = await this.prismaService.vendor.create({
      data: {
        name: vendorName,
        code: vendorCode,
        fixedMillworkCodes: createVendorDto.fixedMillworkCodes ?? false,
      },
    });
    return vendor;
  }

  /**
   * Update an existing vendor
   */
  async update(id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    if (!id) {
      throw new BadRequestException('Vendor ID is required');
    }

    // Check if vendor exists
    const existingVendor = await this.findOne(id);

    // Check for code conflicts if code is being updated
    if (updateVendorDto.code) {
      const codeToCheck = updateVendorDto.code.toUpperCase();
      if (codeToCheck !== existingVendor.code) {
        const duplicateVendor = await this.findByCode(codeToCheck);
        if (duplicateVendor && duplicateVendor.id !== id) {
          throw new ConflictException(`A vendor with code '${codeToCheck}' already exists`);
        }
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (updateVendorDto.name) updateData.name = updateVendorDto.name.trim();
    if (updateVendorDto.code) updateData.code = updateVendorDto.code.toUpperCase();
    if (updateVendorDto.isActive !== undefined) updateData.isActive = updateVendorDto.isActive;
    if (updateVendorDto.fixedMillworkCodes !== undefined) updateData.fixedMillworkCodes = updateVendorDto.fixedMillworkCodes;

    const updated = await this.prismaService.vendor.update({
      where: { id },
      data: updateData,
    });

    // If vendor code changed, update all PF codes across all item tables
    if (updateVendorDto.code && updateVendorDto.code.toUpperCase() !== existingVendor.code) {
      const oldCode = existingVendor.code;
      const newCode = updateVendorDto.code.toUpperCase();
      await this.updatePfCodesForVendor(id, oldCode, newCode);
    }

    return updated;
  }

  /**
   * Update PF codes across all 7 item tables when vendor code changes.
   * Replaces the old vendor code prefix with the new one.
   */
  private async updatePfCodesForVendor(vendorId: string, oldCode: string, newCode: string) {
    // Only these 3 tables have a pfCode column in the Prisma schema
    const tables = [
      'projectItem',
      'directOrderItem',
      'missingExtraItem',
    ] as const;

    const prefix = `${oldCode}-`;
    let totalUpdated = 0;

    for (const table of tables) {
      const items = await (this.prismaService[table] as any).findMany({
        where: {
          vendorId,
          pfCode: { startsWith: prefix },
        },
        select: { id: true, pfCode: true },
      });

      for (const item of items) {
        if (item.pfCode) {
          const newPfCode = `${newCode}-${item.pfCode.slice(prefix.length)}`;
          await (this.prismaService[table] as any).update({
            where: { id: item.id },
            data: { pfCode: newPfCode },
          });
          totalUpdated++;
        }
      }
    }

  }

  /**
   * Soft delete a vendor (set isActive to false)
   */
  async remove(id: string): Promise<{ message: string }> {
    if (!id) {
      throw new BadRequestException('Vendor ID is required');
    }

    // Check if vendor exists
    await this.findOne(id);

    // Check if vendor is used in any project items
    const itemsCount = await this.prismaService.projectItem.count({
      where: { vendorId: id },
    });

    if (itemsCount > 0) {
      // Soft delete - keep the record but mark as inactive
      await this.prismaService.vendor.update({
        where: { id },
        data: { isActive: false },
      });

      return {
        message: `Vendor deactivated successfully. ${itemsCount} project items are still linked to this vendor.`,
      };
    } else {
      // Hard delete if no items are linked
      await this.prismaService.vendor.delete({
        where: { id },
      });

      return {
        message: 'Vendor deleted successfully.',
      };
    }
  }

  // ================== PERMISSION-BASED METHODS ==================

  /**
   * Create vendor with permission check for canManageMasterData
   */
  async createWithPermissionCheck(createVendorDto: CreateVendorDto, userId: string): Promise<Vendor> {
    // Load user's role policy to check canManageMasterData permission
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Get page permissions from role
    const pagePermissions = typeof user.role.pagePermissions === 'string'
      ? JSON.parse(user.role.pagePermissions)
      : user.role.pagePermissions;

    const canManageMasterData = pagePermissions?.canManageMasterData ?? true; // Default true for backward compatibility

    if (!canManageMasterData) {
      throw new ForbiddenException('You do not have permission to create vendors');
    }

    // Permission granted, proceed with creation
    const vendor = await this.create(createVendorDto);

    // AUDIT LOG: Vendor creation
    this.auditLogService.log({
      domain: 'SUPPLIER',
      entityId: vendor.id,
      entityType: 'Vendor',
      projectRef: vendor.code,
      field: 'vendor',
      oldValue: null,
      newValue: `Created: ${vendor.name} (${vendor.code})`,
      action: 'CREATE',
      userId,
      userName: user.name,
      userRole: user.role.name,
    }).catch(() => { });

    return vendor;
  }

  /**
   * Update vendor with permission check for canManageMasterData
   */
  async updateWithPermissionCheck(id: string, updateVendorDto: UpdateVendorDto, userId: string): Promise<Vendor> {
    // Load user's role policy to check canManageMasterData permission
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Get page permissions from role
    const pagePermissions = typeof user.role.pagePermissions === 'string'
      ? JSON.parse(user.role.pagePermissions)
      : user.role.pagePermissions;

    const canManageMasterData = pagePermissions?.canManageMasterData ?? true; // Default true for backward compatibility

    if (!canManageMasterData) {
      throw new ForbiddenException('You do not have permission to update vendors');
    }

    // Get existing vendor for comparison
    const existingVendor = await this.findOne(id);

    // Permission granted, proceed with update
    const updated = await this.update(id, updateVendorDto);

    // AUDIT LOG: Vendor update - track each changed field
    const auditEntries: Array<any> = [];
    if (updateVendorDto.name && updateVendorDto.name.trim() !== existingVendor.name) {
      auditEntries.push({
        domain: 'SUPPLIER',
        entityId: id,
        entityType: 'Vendor',
        projectRef: existingVendor.code,
        field: 'name',
        oldValue: existingVendor.name,
        newValue: updateVendorDto.name.trim(),
        userId,
        userName: user.name,
        userRole: user.role.name,
      });
    }
    if (updateVendorDto.code && updateVendorDto.code.toUpperCase() !== existingVendor.code) {
      auditEntries.push({
        domain: 'SUPPLIER',
        entityId: id,
        entityType: 'Vendor',
        projectRef: existingVendor.code,
        field: 'code',
        oldValue: existingVendor.code,
        newValue: updateVendorDto.code.toUpperCase(),
        userId,
        userName: user.name,
        userRole: user.role.name,
      });
    }
    if (updateVendorDto.isActive !== undefined && updateVendorDto.isActive !== existingVendor.isActive) {
      auditEntries.push({
        domain: 'SUPPLIER',
        entityId: id,
        entityType: 'Vendor',
        projectRef: existingVendor.code,
        field: 'isActive',
        oldValue: existingVendor.isActive.toString(),
        newValue: updateVendorDto.isActive.toString(),
        userId,
        userName: user.name,
        userRole: user.role.name,
      });
    }
    if (auditEntries.length > 0) {
      this.auditLogService.logBatch(auditEntries).catch(() => { });
    }

    return updated;
  }

  /**
   * Delete vendor with permission check for canManageMasterData
   */
  async removeWithPermissionCheck(id: string, userId: string): Promise<{ message: string }> {
    // Load user's role policy to check canManageMasterData permission
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Get page permissions from role
    const pagePermissions = typeof user.role.pagePermissions === 'string'
      ? JSON.parse(user.role.pagePermissions)
      : user.role.pagePermissions;

    const canManageMasterData = pagePermissions?.canManageMasterData ?? true; // Default true for backward compatibility

    if (!canManageMasterData) {
      throw new ForbiddenException('You do not have permission to delete vendors');
    }

    // Get vendor info before deletion
    const vendor = await this.findOne(id);

    // Permission granted, proceed with deletion
    const result = await this.remove(id);

    // AUDIT LOG: Vendor deletion
    this.auditLogService.log({
      domain: 'SUPPLIER',
      entityId: id,
      entityType: 'Vendor',
      projectRef: vendor.code,
      field: 'vendor',
      oldValue: `${vendor.name} (${vendor.code})`,
      newValue: null,
      action: 'DELETE',
      userId,
      userName: user.name,
      userRole: user.role.name,
    }).catch(() => { });

    return result;
  }
}