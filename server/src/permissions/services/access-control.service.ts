import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { getPermissionsV2Config, PermissionsV2Mode } from '../../config/permissions.config';

export interface PermissionDecision {
  allowed: boolean;
  reason?: string;
  metadata?: Record<string, any>;
  isLegacyDecision?: boolean;
}

export interface PermissionContext {
  userId: string;
  itemId?: string;
  newValue?: any;
  oldValue?: any;
}

@Injectable()
export class AccessControlService {
  private readonly logger = new Logger(AccessControlService.name);
  private readonly config = getPermissionsV2Config();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Projects-specific field authorization method
   * Based on existing Projects pattern with V2 permission system overlay
   */
  async updateProjectItemWithFieldAuthorizationV2<T>(
    userId: string,
    itemId: string,
    updateData: Partial<T>,
    updateFn: (itemId: string, data: Partial<T>) => Promise<T>
  ): Promise<T> {
    if (this.config.mode === PermissionsV2Mode.OFF) {
      this.logger.debug(`V2 permissions OFF - using legacy system`);
      return await updateFn(itemId, updateData);
    }

    // Check V2 permissions
    const v2Decision = await this.checkProjectFieldPermissions(userId, updateData);

    if (this.config.logDecisions) {
      this.logger.log('PermissionsV2Decision', {
        userId,
        itemId,
        mode: this.config.mode,
        decision: v2Decision,
        updateFields: Object.keys(updateData)
      });
    }

    // In shadow mode, log but don't enforce
    if (this.config.mode === PermissionsV2Mode.SHADOW) {
      this.logger.log(`SHADOW MODE: Would ${v2Decision.allowed ? 'allow' : 'block'} update - ${v2Decision.reason || 'allowed'}`);
      return await updateFn(itemId, updateData);
    }

    // In enforce mode, block if not allowed
    if (this.config.mode === PermissionsV2Mode.ENFORCE && !v2Decision.allowed) {
      throw new ForbiddenException(v2Decision.reason);
    }

    return await updateFn(itemId, updateData);
  }

  /**
   * Check Projects field permissions using V2 system
   */
  private async checkProjectFieldPermissions(
    userId: string,
    updateData: Record<string, any>
  ): Promise<PermissionDecision> {
    try {
      // Get user's role and column permissions
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              roleColumnVisibility: true
            }
          },
          userAccessPolicy: true
        }
      });

      if (!user) {
        return {
          allowed: false,
          reason: 'User not found',
          metadata: { userId }
        };
      }

      // Build column permissions (same logic as existing Projects system)
      const columnsHidden: string[] = [];
      const columnsReadOnly: string[] = [];

      // Role-based column visibility
      user.role.roleColumnVisibility.forEach(cv => {
        if (cv.isHidden) {
          columnsHidden.push(cv.columnKey);
        } else if (cv.isReadOnly) {
          columnsReadOnly.push(cv.columnKey);
        }
      });

      // User-specific overrides
      if (user.userAccessPolicy) {
        columnsHidden.push(...(user.userAccessPolicy.columnsHidden || []));
        columnsReadOnly.push(...(user.userAccessPolicy.columnsReadOnly || []));
      }

      // Check each field being updated
      const systemFields = ['id', 'createdAt', 'updatedAt', 'projectId'];
      const userFields = Object.keys(updateData).filter(field => !systemFields.includes(field));
      const blockedFields: string[] = [];

      for (const field of userFields) {
        // Map frontend field names to canonical column keys
        const canonicalField = this.mapToCanonicalColumnKey(field);

        if (columnsHidden.includes(canonicalField) || columnsReadOnly.includes(canonicalField)) {
          blockedFields.push(field);
        }
      }

      const allowed = blockedFields.length === 0;

      return {
        allowed,
        reason: allowed
          ? undefined
          : `Fields are hidden or read-only for role ${user.role.name}: ${blockedFields.join(', ')}`,
        metadata: {
          userId,
          role: user.role.name,
          blockedFields,
          checkedFields: userFields,
          columnsHidden,
          columnsReadOnly
        }
      };

    } catch (error) {
      this.logger.error(`Error checking project field permissions:`, error);
      return {
        allowed: false,
        reason: 'Permission check failed',
        metadata: { error: error.message }
      };
    }
  }

  /**
   * Map frontend field names to canonical column keys
   * Preserves existing Projects mapping logic
   */
  private mapToCanonicalColumnKey(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      'vendorId': 'vendor',
      'orderTypeId': 'orderType',
      // Add more mappings as needed
    };

    return fieldMap[fieldName] || fieldName;
  }

  /**
   * Get user's visible columns for Projects (for API filtering)
   */
  async getProjectVisibleColumns(userId: string): Promise<string[]> {
    if (this.config.mode === PermissionsV2Mode.OFF) {
      // Return all Projects columns when V2 is off
      return [
        'projectNo', 'type', 'pfCode', 'vendor', 'orderType',
        'poSignStatus', 'pfSignStatus', 'status', 'std', 'etd',
        'rtd', 'rtr', 'ftd', 'pfUsd', 'pfTl', 'paymentRule',
        'containerNo', 'containerDate'
      ];
    }

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: { include: { roleColumnVisibility: true } },
          userAccessPolicy: true
        }
      });

      if (!user) {
        return [];
      }

      // Get all Projects columns from registry
      const allColumns = await this.prisma.columnRegistry.findMany({
        where: { isActive: true },
        select: { key: true }
      });

      // Build hidden columns list
      const columnsHidden: string[] = [];

      user.role.roleColumnVisibility.forEach(cv => {
        if (cv.isHidden) {
          columnsHidden.push(cv.columnKey);
        }
      });

      if (user.userAccessPolicy?.columnsHidden) {
        columnsHidden.push(...user.userAccessPolicy.columnsHidden);
      }

      // Return visible columns
      return allColumns
        .map(col => col.key)
        .filter(key => !columnsHidden.includes(key));

    } catch (error) {
      this.logger.error(`Error getting project visible columns:`, error);
      return [];
    }
  }

  /**
   * Check page access permissions
   * Used by PageAccessGuard
   */
  async checkPageAccess(userId: string, pageId: string): Promise<PermissionDecision> {
    if (this.config.mode === PermissionsV2Mode.OFF) {
      return {
        allowed: true,
        reason: 'V2 permissions disabled',
        isLegacyDecision: true
      };
    }

    // TODO: Implement page access checking
    return {
      allowed: true,
      reason: 'Page access check not yet implemented',
      metadata: { pageId, userId }
    };
  }

  /**
   * Check table access permissions
   * Used by TableAccessGuard
   */
  async checkTableAccess(userId: string, tableId: string, action: string): Promise<PermissionDecision> {
    if (this.config.mode === PermissionsV2Mode.OFF) {
      return {
        allowed: true,
        reason: 'V2 permissions disabled',
        isLegacyDecision: true
      };
    }

    // TODO: Implement table access checking
    return {
      allowed: true,
      reason: 'Table access check not yet implemented',
      metadata: { tableId, action, userId }
    };
  }

  /**
   * Check if V2 permissions are enabled for specific context
   */
  isV2Enabled(tableKey?: string, userId?: string): boolean {
    if (this.config.mode === PermissionsV2Mode.OFF) {
      return false;
    }

    // Check if enabled for specific table
    if (tableKey && !this.config.enabledForTables.includes(tableKey)) {
      return false;
    }

    // Check if enabled for specific user (if configured)
    if (userId && this.config.enabledForUsers.length > 0) {
      return this.config.enabledForUsers.includes(userId);
    }

    return true;
  }

  /**
   * Get visible columns for supplier-me-sheet (Missing/Extra) table for a specific user
   */
  async getSupplierMeVisibleColumns(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { roleColumnVisibility: true } },
      },
    });

    if (!user?.role) {
      return [];
    }

    // Define all possible columns for supplier-me-sheet
    const allColumns = ['type', 'pfSignStatus', 'poSignStatus', 'status', 'pfUsd', 'pfTl'];

    // Get hidden columns for this user's role
    const hiddenColumns: string[] = [];
    user.role.roleColumnVisibility.forEach(cv => {
      if (cv.isHidden) {
        hiddenColumns.push(cv.columnKey);
      }
    });

    return allColumns.filter(col => !hiddenColumns.includes(col));
  }

  /**
   * Get visible columns for supplier-do-sheet (Direct Orders) table for a specific user
   */
  async getSupplierDoVisibleColumns(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { roleColumnVisibility: true } },
      },
    });

    if (!user?.role) {
      return [];
    }

    // Define all possible columns for supplier-do-sheet (Direct Orders)
    const allColumns = ['type', 'pfCode', 'pfSignStatus', 'poSignStatus', 'status', 'vendorCode', 'vendorName', 'orderType', 'std', 'etd', 'rtd', 'rtr', 'ftd', 'containerNo', 'paymentRule'];

    // Get hidden columns for this user's role
    const hiddenColumns: string[] = [];
    user.role.roleColumnVisibility.forEach(cv => {
      if (cv.isHidden) {
        hiddenColumns.push(cv.columnKey);
      }
    });

    return allColumns.filter(col => !hiddenColumns.includes(col));
  }

  /**
   * Get column rules for a specific table and role
   */
  async getSupplierColumnRulesByTableAndRole(tableId: string, roleId: string): Promise<Record<string, string>> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { roleColumnVisibility: true }
    });

    if (!role) {
      return {};
    }

    const columnRules: Record<string, string> = {};

    role.roleColumnVisibility.forEach(cv => {
      if (cv.isHidden) {
        columnRules[cv.columnKey] = 'HIDDEN';
      } else if (cv.isReadOnly) {
        columnRules[cv.columnKey] = 'READ_ONLY';
      } else {
        columnRules[cv.columnKey] = 'EDITABLE';
      }
    });

    return columnRules;
  }
}