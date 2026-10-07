import { Module } from '@nestjs/common';
import { DirectOrdersService } from './direct-orders.service';
import { DirectOrdersController } from './direct-orders.controller';
import { DirectOrderPfCodeGenerationService } from './services/direct-order-pf-code-generation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VendorsModule } from '../vendors/vendors.module';
import { CustomTypesModule } from '../custom-types/custom-types.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SupplierTotalsModule } from '../supplier-totals/supplier-totals.module';

@Module({
  imports: [PrismaModule, VendorsModule, CustomTypesModule, PermissionsModule, AuditLogModule, SupplierTotalsModule],
  controllers: [DirectOrdersController],
  providers: [DirectOrdersService, DirectOrderPfCodeGenerationService],
  exports: [DirectOrdersService, DirectOrderPfCodeGenerationService],
})
export class DirectOrdersModule {}