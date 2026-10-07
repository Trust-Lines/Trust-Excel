import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { PageAccessGuard } from './page-access.guard';
import { TableAccessGuard } from './table-access.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

/**
 * Combined Access Guard
 * Combines the legacy RolesGuard with new permission system guards
 * This allows gradual migration from role-based to permission-based access control
 */
@Injectable()
export class CombinedAccessGuard implements CanActivate {
  private readonly logger = new Logger(CombinedAccessGuard.name);

  constructor(
    private rolesGuard: RolesGuard,
    private pageAccessGuard: PageAccessGuard,
    private tableAccessGuard: TableAccessGuard
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('CombinedAccessGuard: Checking permissions');

    try {
      // 1. First check legacy role-based access (if @Roles decorator is present)
      const rolesResult = this.rolesGuard.canActivate(context);
      this.logger.debug(`Roles guard result: ${rolesResult}`);

      // 2. Then check page-level access (if @PageAccess decorator is present)
      const pageResult = await this.pageAccessGuard.canActivate(context);
      this.logger.debug(`Page access guard result: ${pageResult}`);

      // 3. Finally check table-level access (if @TableAccess decorator is present)
      const tableResult = await this.tableAccessGuard.canActivate(context);
      this.logger.debug(`Table access guard result: ${tableResult}`);

      // All guards must pass
      const allPassed = rolesResult && pageResult && tableResult;
      this.logger.debug(`Combined access guard result: ${allPassed}`);

      return allPassed;
    } catch (error) {
      this.logger.error('CombinedAccessGuard error:', error);
      throw error; // Re-throw the specific error from the failing guard
    }
  }
}

/**
 * Permission Guard Factory
 * Creates guards for specific use cases
 */
@Injectable()
export class PermissionGuardFactory {
  constructor(
    private rolesGuard: RolesGuard,
    private pageAccessGuard: PageAccessGuard,
    private tableAccessGuard: TableAccessGuard
  ) {}

  /**
   * Creates a guard that only checks role permissions (legacy mode)
   */
  createRoleOnlyGuard(): CanActivate {
    return this.rolesGuard;
  }

  /**
   * Creates a guard that only checks page permissions
   */
  createPageOnlyGuard(): CanActivate {
    return this.pageAccessGuard;
  }

  /**
   * Creates a guard that only checks table permissions
   */
  createTableOnlyGuard(): CanActivate {
    return this.tableAccessGuard;
  }

  /**
   * Creates a guard that checks both page and table permissions (skip roles)
   */
  createModernPermissionGuard(): CanActivate {
    return {
      canActivate: async (context: ExecutionContext) => {
        const pageResult = await this.pageAccessGuard.canActivate(context);
        const tableResult = await this.tableAccessGuard.canActivate(context);
        return pageResult && tableResult;
      }
    };
  }

  /**
   * Creates the full combined guard (roles + page + table)
   */
  createCombinedGuard(): CanActivate {
    return new CombinedAccessGuard(
      this.rolesGuard,
      this.pageAccessGuard,
      this.tableAccessGuard
    );
  }
}