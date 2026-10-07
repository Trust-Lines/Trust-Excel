// Permissions Module
export { PermissionsModule } from './permissions.module';

// Services
export { AccessControlService, PermissionDecision, PermissionContext } from './services/access-control.service';
export {
  ResourceRegistryService,
  PageDefinition,
  TableDefinition,
  ColumnDefinition,
  ActionDefinition
} from './services/resource-registry.service';
export { TypeVisibilityService } from './services/type-visibility.service';
export { ProjectScopeService } from './services/project-scope.service';

// Decorators
export {
  PageAccess,
  TableAccess,
  FieldAuthorized,
  ProjectAccess,
  SupplierAccess,
  AdminAccess,
  PAGE_ACCESS_KEY,
  TABLE_ACCESS_KEY,
  FIELD_AUTHORIZED_KEY
} from './decorators/permissions.decorator';

// Guards
export { PageAccessGuard } from './guards/page-access.guard';
export { TableAccessGuard } from './guards/table-access.guard';
export { CombinedAccessGuard, PermissionGuardFactory } from './guards/combined-access.guard';