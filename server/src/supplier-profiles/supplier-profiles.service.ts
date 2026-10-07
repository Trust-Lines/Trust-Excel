import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSupplierProfileDto } from './dto/update-supplier-profile.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class SupplierProfilesService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  /**
   * Get supplier profile by vendorId
   * Auto-creates empty profile if it doesn't exist
   */
  async getOrCreateByVendorId(vendorId: string, userId?: string) {
    // Check if vendor exists
    const vendor = await this.prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with id ${vendorId} not found`);
    }

    // Find or create supplier profile
    let profile = await this.prisma.supplierProfile.findUnique({
      where: { vendorId },
    });

    if (!profile) {
      // Auto-create empty profile
      profile = await this.prisma.supplierProfile.create({
        data: {
          vendorId,
        },
      });

      // AUDIT LOG: Auto-creation of supplier profile
      if (userId) {
        const userInfo = await this.auditLogService.resolveUser(userId);
        this.auditLogService.log({
          domain: 'SUPPLIER',
          entityId: profile.id,
          entityType: 'SupplierProfile',
          projectRef: vendor.name,
          field: 'profile',
          oldValue: null,
          newValue: `Auto-created profile for ${vendor.name}`,
          action: 'CREATE',
          userId,
          userName: userInfo?.name,
          userRole: userInfo?.role,
        }).catch(() => {});
      }
    }

    return profile;
  }

  /**
   * Update supplier profile by vendorId
   */
  async updateByVendorId(
    vendorId: string,
    updateDto: UpdateSupplierProfileDto,
    userId?: string,
  ) {
    // Ensure profile exists (will auto-create if needed)
    const existingProfile = await this.getOrCreateByVendorId(vendorId);

    // Prepare update data
    const updateData: any = {};

    if (updateDto.companyName !== undefined) {
      updateData.companyName = updateDto.companyName || null;
    }
    if (updateDto.bankName !== undefined) {
      updateData.bankName = updateDto.bankName || null;
    }
    if (updateDto.iban !== undefined) {
      // Trim whitespace from IBAN
      updateData.iban = updateDto.iban ? updateDto.iban.replace(/\s/g, '') : null;
    }
    if (updateDto.officialName !== undefined) {
      updateData.officialName = updateDto.officialName || null;
    }
    if (updateDto.noteDate !== undefined) {
      updateData.noteDate = updateDto.noteDate ? new Date(updateDto.noteDate) : null;
    }

    // Update profile
    const updatedProfile = await this.prisma.supplierProfile.update({
      where: { vendorId },
      data: updateData,
    });

    // UNIFIED AUDIT LOG
    if (userId) {
      const vendor = await this.prisma.vendor.findUnique({
        where: { id: vendorId },
        select: { name: true },
      });
      const userInfo = await this.auditLogService.resolveUser(userId);
      const auditEntries: Array<any> = [];

      const fieldsToTrack = ['companyName', 'bankName', 'iban', 'officialName', 'noteDate'];
      for (const field of fieldsToTrack) {
        if (updateData[field] === undefined) continue;
        const oldVal = (existingProfile as any)[field];
        const newVal = updateData[field];
        const fmt = (v: any) => v?.toISOString?.() || v?.toString?.() || v || null;
        if (fmt(oldVal) !== fmt(newVal)) {
          auditEntries.push({
            domain: 'SUPPLIER',
            entityId: existingProfile.id,
            entityType: 'SupplierProfile',
            projectRef: vendor?.name || null,
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
        this.auditLogService.logBatch(auditEntries).catch(() => {});
      }
    }

    return updatedProfile;
  }
}
