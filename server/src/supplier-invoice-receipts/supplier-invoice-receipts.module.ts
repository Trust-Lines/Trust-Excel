import { Module } from '@nestjs/common';
import { SupplierInvoiceReceiptsController } from './supplier-invoice-receipts.controller';
import { SupplierInvoiceReceiptsService } from './supplier-invoice-receipts.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [SupplierInvoiceReceiptsController],
  providers: [SupplierInvoiceReceiptsService],
})
export class SupplierInvoiceReceiptsModule {}
