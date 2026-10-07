import { Module } from '@nestjs/common';
import { SupplierProfilesController } from './supplier-profiles.controller';
import { SupplierProfilesService } from './supplier-profiles.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [SupplierProfilesController],
  providers: [SupplierProfilesService],
})
export class SupplierProfilesModule {}
