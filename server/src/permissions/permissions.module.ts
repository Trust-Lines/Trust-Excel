import { Module } from '@nestjs/common';
import { AccessControlService } from './services/access-control.service';
import { ResourceRegistryService } from './services/resource-registry.service';
import { TypeVisibilityService } from './services/type-visibility.service';
import { ProjectScopeService } from './services/project-scope.service';
import { PageAccessGuard } from './guards/page-access.guard';
import { TableAccessGuard } from './guards/table-access.guard';
import { CombinedAccessGuard, PermissionGuardFactory } from './guards/combined-access.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminModule } from '../admin/admin.module';
import { SupplierPermissionsController } from './supplier-permissions.controller';

@Module({
  imports: [PrismaModule, AdminModule],
  controllers: [SupplierPermissionsController],
  providers: [
    // Services
    AccessControlService,
    ResourceRegistryService,
    TypeVisibilityService,
    ProjectScopeService,

    // Guards
    RolesGuard, // Re-export for convenience
    PageAccessGuard,
    TableAccessGuard,
    CombinedAccessGuard,
    PermissionGuardFactory,
  ],
  exports: [
    // Services
    AccessControlService,
    ResourceRegistryService,
    TypeVisibilityService,
    ProjectScopeService,

    // Guards
    PageAccessGuard,
    TableAccessGuard,
    CombinedAccessGuard,
    PermissionGuardFactory,
  ],
})
export class PermissionsModule {}