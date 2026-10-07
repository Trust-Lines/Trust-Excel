import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PfCodeGenerationService } from './services/pf-code-generation.service';
import { PrismaModule } from '../prisma/prisma.module';
import { VendorsModule } from '../vendors/vendors.module';
import { CustomTypesModule } from '../custom-types/custom-types.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SupplierTotalsModule } from '../supplier-totals/supplier-totals.module';
import { NotificationModule } from '../notifications/notification.module';
import { DropboxModule } from '../dropbox/dropbox.module';
import { TodayPfModule } from '../today-pf/today-pf.module';

@Module({
  imports: [PrismaModule, VendorsModule, CustomTypesModule, PermissionsModule, AuditLogModule, SupplierTotalsModule, NotificationModule, DropboxModule, TodayPfModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, PfCodeGenerationService],
  exports: [ProjectsService, PfCodeGenerationService],
})
export class ProjectsModule {}