import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateInvoiceReceiptRowDto } from './dto/create-invoice-receipt-row.dto';
import { UpdateInvoiceReceiptRowDto } from './dto/update-invoice-receipt-row.dto';

@Injectable()
export class SupplierInvoiceReceiptsService {
  constructor(
    private prisma: PrismaService,
    private auditLogService: AuditLogService,
  ) {}

  async getByVendorCodeAndMode(vendorCode: string, mode: string) {
    // Find vendor by code
    const vendor = await this.prisma.vendor.findFirst({
      where: { code: vendorCode },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with code ${vendorCode} not found`);
    }

    // Get all rows for this vendor and mode
    const rows = await this.prisma.supplierInvoiceReceiptRow.findMany({
      where: {
        vendorId: vendor.id,
        mode: mode
      },
      orderBy: [{ region: 'asc' }],
    });

    // Create a map by itemId for easy lookup
    const itemMap: Record<string, any> = {};
    rows.forEach((row) => {
      itemMap[row.itemId] = row;
    });

    // Group rows by region for frontend compatibility
    const regions: Record<string, any[]> = {
      'TLINES_NE': [],
      'TLINES_SE': [],
      'TLINES_NW': [],
      'TLINES_CVW': [],
      'TLINES_HQ': [],
      'TLINES_TC': []
    };

    rows.forEach((row) => {
      if (regions[row.region]) {
        regions[row.region].push(row);
      }
    });

    return {
      vendorCode,
      mode,
      itemMap,
      regions,
    };
  }

  async upsertByItemId(itemId: string, dto: CreateInvoiceReceiptRowDto, userId?: string) {
    // Find vendor
    const vendor = await this.prisma.vendor.findFirst({
      where: { code: dto.vendorCode },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with code ${dto.vendorCode} not found`);
    }

    // Check if existing row exists for audit comparison
    const existing = await this.prisma.supplierInvoiceReceiptRow.findUnique({
      where: { itemId },
    });

    const result = await this.prisma.supplierInvoiceReceiptRow.upsert({
      where: { itemId },
      update: {
        transactionNo: dto.transactionNo || '',
        invoiceNumber: dto.invoiceNumber || '',
        quickBook: dto.quickBook || '',
      },
      create: {
        itemId,
        mode: dto.mode,
        vendorId: vendor.id,
        region: dto.region,
        transactionNo: dto.transactionNo || '',
        invoiceNumber: dto.invoiceNumber || '',
        quickBook: dto.quickBook || '',
      },
    });

    // AUDIT LOG
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      const auditEntries: Array<any> = [];

      if (!existing) {
        // New row created
        auditEntries.push({
          domain: 'SUPPLIER',
          entityId: result.id,
          entityType: 'InvoiceReceipt',
          projectRef: dto.vendorCode,
          field: 'invoiceReceipt',
          oldValue: null,
          newValue: `Created: ${dto.region} (${dto.mode})`,
          action: 'CREATE',
          userId,
          userName: userInfo?.name,
          userRole: userInfo?.role,
        });
      } else {
        // Update - track changed fields
        const fields = ['transactionNo', 'invoiceNumber', 'quickBook'];
        for (const field of fields) {
          const oldVal = (existing as any)[field] || '';
          const newVal = (dto as any)[field] || '';
          if (oldVal !== newVal) {
            auditEntries.push({
              domain: 'SUPPLIER',
              entityId: result.id,
              entityType: 'InvoiceReceipt',
              projectRef: dto.vendorCode,
              field,
              oldValue: oldVal || null,
              newValue: newVal || null,
              userId,
              userName: userInfo?.name,
              userRole: userInfo?.role,
            });
          }
        }
      }

      if (auditEntries.length > 0) {
        this.auditLogService.logBatch(auditEntries).catch(() => {});
      }
    }

    return result;
  }

  async update(id: string, dto: UpdateInvoiceReceiptRowDto, userId?: string) {
    const row = await this.prisma.supplierInvoiceReceiptRow.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!row) {
      throw new NotFoundException(`Row with id ${id} not found`);
    }

    const updated = await this.prisma.supplierInvoiceReceiptRow.update({
      where: { id },
      data: {
        ...(dto.transactionNo !== undefined && { transactionNo: dto.transactionNo }),
        ...(dto.invoiceNumber !== undefined && { invoiceNumber: dto.invoiceNumber }),
        ...(dto.quickBook !== undefined && { quickBook: dto.quickBook }),
      },
    });

    // AUDIT LOG
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      const auditEntries: Array<any> = [];
      const fields = ['transactionNo', 'invoiceNumber', 'quickBook'];
      for (const field of fields) {
        if ((dto as any)[field] === undefined) continue;
        const oldVal = (row as any)[field] || '';
        const newVal = (dto as any)[field] || '';
        if (oldVal !== newVal) {
          auditEntries.push({
            domain: 'SUPPLIER',
            entityId: id,
            entityType: 'InvoiceReceipt',
            projectRef: (row as any).vendor?.code || null,
            field,
            oldValue: oldVal || null,
            newValue: newVal || null,
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

    return updated;
  }

  async delete(id: string, userId?: string) {
    const row = await this.prisma.supplierInvoiceReceiptRow.findUnique({
      where: { id },
      include: { vendor: true },
    });

    if (!row) {
      throw new NotFoundException(`Row with id ${id} not found`);
    }

    await this.prisma.supplierInvoiceReceiptRow.delete({
      where: { id },
    });

    // AUDIT LOG
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      this.auditLogService.log({
        domain: 'SUPPLIER',
        entityId: id,
        entityType: 'InvoiceReceipt',
        projectRef: (row as any).vendor?.code || null,
        field: 'invoiceReceipt',
        oldValue: `${row.region} - ${row.transactionNo || ''} / ${row.invoiceNumber || ''}`,
        newValue: null,
        action: 'DELETE',
        userId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(() => {});
    }

    return { message: 'Row deleted successfully' };
  }
}
