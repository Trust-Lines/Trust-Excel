import { Module } from '@nestjs/common';
import { MissingExtraService } from './missing-extra.service';
import { MissingExtraController } from './missing-extra.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SupplierTotalsModule } from '../supplier-totals/supplier-totals.module';

@Module({
  imports: [PrismaModule, ProjectsModule, PermissionsModule, AuditLogModule, SupplierTotalsModule],
  controllers: [MissingExtraController],
  providers: [MissingExtraService],
  exports: [MissingExtraService],
})
export class MissingExtraModule {}