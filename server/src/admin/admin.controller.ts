import {
  Controller,
  Post,
  Get,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  Query,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { AdminService } from './admin.service';
import { InviteUserDto, InviteUserResponseDto } from './dto/invite-user.dto';
import { UpdateRolePolicyDto, RolePolicyResponseDto, ColumnDefinitionDto, RoleWithPolicyDto } from './dto/role-policy.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('admin_roles_permissions')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('users/invite')
  async inviteUser(
    @Body() inviteUserDto: InviteUserDto,
    @Request() req,
  ): Promise<InviteUserResponseDto> {
    try {
      const inviterUserId = req.user.id;
      return await this.adminService.inviteUser(inviteUserDto, inviterUserId);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to invite user',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users')
  async getUsers(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      const limitNum = limit ? parseInt(limit, 10) : 50;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      return await this.adminService.getUsers(search, limitNum, offsetNum);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve users',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { roleId?: string; isActive?: boolean },
    @Request() req,
  ) {
    try {
      const currentUserId = req.user.id;
      return await this.adminService.updateUser(id, body, currentUserId);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update user',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    try {
      const currentUserId = req.user.id;
      return await this.adminService.deleteUser(id, currentUserId);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to delete user',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('users/:id/resend-invite')
  async resendInvite(@Param('id') id: string, @Request() req) {
    try {
      const inviterUserId = req.user.id;
      return await this.adminService.resendInvite(id, inviterUserId);
    } catch (error) {
      if (error.status) {
        throw error;
      }
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to resend invite',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('roles')
  async getRoles() {
    try {
      return await this.adminService.getRoles();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve roles',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('roles')
  async createRole(@Body() body: { name: string; description?: string }) {
    try {
      return await this.adminService.createRole(body);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to create role',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Patch('roles/:id')
  async updateRole(@Param('id') id: string, @Body() body: { name?: string; isActive?: boolean }) {
    try {
      return await this.adminService.updateRole(id, body);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update role',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    try {
      return await this.adminService.deleteRole(id);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to delete role',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('columns')
  async getOperationalBoardColumns() {
    try {
      return await this.adminService.getOperationalBoardColumns();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve column definitions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('roles/:roleId/policy')
  async getRoleColumnPolicy(@Param('roleId') roleId: string) {
    try {
      return await this.adminService.getRoleColumnPolicy(roleId);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve role column policy',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('roles/:roleId/policy')
  async updateRoleColumnPolicy(
    @Param('roleId') roleId: string,
    @Body() updatePolicyDto: UpdateRolePolicyDto,
  ): Promise<RolePolicyResponseDto> {
    try {
      const result = await this.adminService.updateRolePolicy(roleId, updatePolicyDto);

      // Invalidate permission cache after update
      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      console.error('❌ Failed to update role policy:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update role policy',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== GATE B: PROJECTS-ONLY PERMISSION ENDPOINTS ==================

  /**
   * GET /admin/permissions/projects/roles
   * Get all roles with Projects (operational-board-grid) permissions
   */
  @Get('permissions/projects/roles')
  async getProjectsRolesPermissions() {
    try {
      return await this.adminService.getProjectsRolesPermissions();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve Projects roles permissions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PATCH /admin/permissions/projects/roles/:roleId/actions
   * Update table actions for a role on Projects table (operational-board-grid)
   */
  @Patch('permissions/projects/roles/:roleId/actions')
  async updateProjectsRoleActions(
    @Param('roleId') roleId: string,
    @Body() body: {
      canView?: boolean;
      canCreate?: boolean;
      canEdit?: boolean;
      canDelete?: boolean;
      canExport?: boolean;
      canApprove?: boolean;
    },
  ) {
    try {
      const result = await this.adminService.updateProjectsRoleActions(roleId, body);

      // Invalidate permission cache after update
      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      console.error('❌ [GATE B] Failed to update Projects role actions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update Projects role actions',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * PATCH /admin/permissions/projects/roles/:roleId/columns
   * Update column permissions for a role on Projects table (operational-board-grid)
   */
  @Patch('permissions/projects/roles/:roleId/columns')
  async updateProjectsRoleColumns(
    @Param('roleId') roleId: string,
    @Body() body: {
      columnPermissions: {
        [columnKey: string]: {
          isVisible?: boolean;
          isReadOnly?: boolean;
          requiresApproval?: boolean;
        };
      };
    },
  ) {
    try {
      const result = await this.adminService.updateProjectsRoleColumns(roleId, body.columnPermissions);

      // Invalidate permission cache after update
      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      console.error('❌ [GATE B] Failed to update Projects role columns:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update Projects role columns',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== PERMISSION REGISTRY ==================

  /**
   * GET /admin/permissions/registry/tables
   * Get all available tables and their columns (dynamic registry)
   */
  @Get('permissions/registry/tables')
  async getTableRegistry() {
    try {
      return await this.adminService.getTableRegistry();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve table registry',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  // ================== SUPPLIER PERMISSIONS (Projects pattern kopyasi) ==================

  /**
   * GET /admin/permissions/suppliers/roles/:roleId
   * Get supplier permissions for a role (all supplier tables)
   */
  @Get('permissions/suppliers/roles/:roleId')
  async getSupplierRolePermissions(@Param('roleId') roleId: string) {
    try {
      return await this.adminService.getSupplierRolePermissions(roleId);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve supplier role permissions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PATCH /admin/permissions/suppliers/roles/:roleId/columns
   * Update supplier column permissions for a role and table
   */
  @Patch('permissions/suppliers/roles/:roleId/columns')
  async updateSupplierRoleColumns(
    @Param('roleId') roleId: string,
    @Body() body: {
      tableKey: string;
      columnsHidden: string[];
      columnsReadOnly: string[];
    },
  ) {
    try {
      const result = await this.adminService.updateSupplierRoleColumns(roleId, body);

      // Invalidate permission cache after update
      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      console.error('❌ [SUPPLIER] Failed to update supplier role columns:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update supplier role columns',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * PATCH /admin/permissions/suppliers/roles/:roleId/tables
   * Update supplier table action permissions
   */
  @Patch('permissions/suppliers/roles/:roleId/tables')
  async updateSupplierRoleTableActions(
    @Param('roleId') roleId: string,
    @Body() body: {
      tableKey: string;
      canView?: boolean;
      canEdit?: boolean;
      canExport?: boolean;
      canCreate?: boolean;
      canDelete?: boolean;
    },
  ) {
    try {
      const result = await this.adminService.updateSupplierRoleTableActions(roleId, body);

      // Invalidate permission cache after update
      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      console.error('❌ [SUPPLIER] Failed to update supplier role table actions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update supplier role table actions',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== COMPREHENSIVE PERMISSION MANAGEMENT ==================

  /**
   * GET /admin/permissions/roles
   * Get all roles with basic information for permission management
   */
  @Get('permissions/roles')
  async getPermissionRoles() {
    try {
      return await this.adminService.getPermissionRoles();
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve roles for permission management',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * GET /admin/permissions/role/:roleId
   * Get full permission policy for a role (pages + tables + columns + actions)
   */
  @Get('permissions/role/:roleId')
  async getRoleFullPolicy(@Param('roleId') roleId: string) {
    try {
      return await this.adminService.getRoleFullPolicy(roleId);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve full role policy',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PATCH /admin/permissions/role/:roleId/pages
   * Update page-level permissions for a role
   */
  @Patch('permissions/role/:roleId/pages')
  async updateRolePagePermissions(
    @Param('roleId') roleId: string,
    @Body() body: {
      pagePermissions: {
        [pageKey: string]: {
          hasAccess: boolean;
        };
      };
    },
  ) {
    try {
      const result = await this.adminService.updateRolePagePermissions(roleId, body.pagePermissions);

      // Invalidate permission cache after update
      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      console.error('❌ [COMPREHENSIVE] Failed to update role page permissions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update role page permissions',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * PATCH /admin/permissions/role/:roleId/tables
   * Update table-level permissions for a role (which tables are visible within pages)
   */
  @Patch('permissions/role/:roleId/tables')
  async updateRoleTablePermissions(
    @Param('roleId') roleId: string,
    @Body() body: {
      tablePermissions: {
        [tableKey: string]: {
          hasAccess: boolean;
        };
      };
    },
  ) {
    try {
      const result = await this.adminService.updateRoleTablePermissions(roleId, body.tablePermissions);

      // Invalidate permission cache after update
      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      console.error('❌ [COMPREHENSIVE] Failed to update role table permissions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update role table permissions',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * PATCH /admin/permissions/role/:roleId/columns
   * Update column-level permissions for a role (extends existing column policy system)
   */
  @Patch('permissions/role/:roleId/columns')
  async updateRoleColumnPermissions(
    @Param('roleId') roleId: string,
    @Body() body: {
      tableId?: string;
      columnPermissions: {
        [columnKey: string]: {
          isHidden?: boolean;
          isReadOnly?: boolean;
          requiresApproval?: boolean;
        };
      };
    },
  ) {
    try {
      const result = await this.adminService.updateRoleColumnPermissions(roleId, body.tableId, body.columnPermissions);

      // Invalidate permission cache after update
      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      console.error('❌ [COMPREHENSIVE] Failed to update role column permissions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update role column permissions',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * PATCH /admin/permissions/role/:roleId/actions
   * Update action-level permissions for a role (view/create/edit/delete/export/approve per table)
   */
  @Patch('permissions/role/:roleId/actions')
  async updateRoleActionPermissions(
    @Param('roleId') roleId: string,
    @Body() body: {
      tableId?: string;
      actions: {
        [actionKey: string]: boolean;
      };
    },
  ) {
    try {
      const result = await this.adminService.updateRoleActionPermissions(roleId, body.tableId, body.actions);

      // Invalidate permission cache after update
      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      console.error('❌ [COMPREHENSIVE] Failed to update role action permissions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update role action permissions',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== GATE C: SUPPLIER REGISTRY & PERMISSION ENDPOINTS ==================

  /**
   * Get supplier registry with main tabs, tables, and columns
   * Frontend: loadTableRegistry() -> /api/admin/permissions/registry/suppliers
   */
  @Get('permissions/registry/suppliers')
  async getSupplierRegistry() {
    try {
      const registry = await this.adminService.getSupplierRegistry();

      return {
        success: true,
        data: registry
      };
    } catch (error) {
      console.error('❌ [SUPPLIER_REGISTRY] Failed to load supplier registry:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to load supplier registry',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all supplier permissions for a specific role
   * Frontend: loadSupplierPermissions(roleId) -> /api/admin/permissions/supplier/:roleId
   */
  @Get('permissions/supplier/:roleId')
  async getSupplierPermissions(@Param('roleId') roleId: string) {
    try {
      const permissions = await this.adminService.getSupplierPermissions(roleId);

      return {
        success: true,
        data: permissions
      };
    } catch (error) {
      console.error('❌ [SUPPLIER_PERMS] Failed to load supplier permissions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to load supplier permissions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update supplier table actions (view/edit/export)
   * Frontend: handleToggleAction() -> PATCH /api/admin/permissions/supplier/table-actions
   */
  @Patch('permissions/supplier/table-actions')
  async updateSupplierTableActions(
    @Body() updateDto: {
      roleId: string;
      tableKey: string;  // e.g., "supplier:P:projects"
      actions: {
        view: boolean;
        edit: boolean;
        export: boolean;
      };
    }
  ) {
    try {
      const result = await this.adminService.updateSupplierTableActions(
        updateDto.roleId,
        updateDto.tableKey,
        updateDto.actions
      );

      return {
        success: true,
        message: 'Table actions updated successfully',
        data: result
      };
    } catch (error) {
      console.error('❌ [SUPPLIER_ACTIONS] Failed to update table actions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update supplier table actions',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update supplier column rules (hidden/readonly/editable)
   * Frontend: handleSetColumnRule() -> PATCH /api/admin/permissions/supplier/column-rules
   */
  @Patch('permissions/supplier/column-rules')
  async updateSupplierColumnRules(
    @Body() updateDto: {
      roleId: string;
      tableKey: string;  // e.g., "supplier:P:projects"
      columnRules: Record<string, 'hidden' | 'readonly' | 'editable'>;
    }
  ) {
    try {
      const result = await this.adminService.updateSupplierColumnRules(
        updateDto.roleId,
        updateDto.tableKey,
        updateDto.columnRules
      );

      return {
        success: true,
        message: 'Column rules updated successfully',
        data: result
      };
    } catch (error) {
      console.error('❌ [SUPPLIER_COLUMNS] Failed to update column rules:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update supplier column rules',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update page access for a role (Suppliers Management page)
   * Frontend: Pages tab checkbox -> PATCH /api/admin/permissions/pages
   */
  @Patch('permissions/pages')
  async updatePagePermissions(
    @Body() updateDto: {
      roleId: string;
      pageKey: string;  // e.g., "suppliers"
      hasAccess: boolean;
    }
  ) {
    try {
      const result = await this.adminService.updatePagePermissions(
        updateDto.roleId,
        updateDto.pageKey,
        updateDto.hasAccess
      );

      return {
        success: true,
        message: 'Page permissions updated successfully',
        data: result
      };
    } catch (error) {
      console.error('❌ [PAGE_ACCESS] Failed to update page permissions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update page permissions',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get page permissions for a role
   * Frontend: Load page access state
   */
  @Get('permissions/:roleId/pages')
  async getPagePermissions(@Param('roleId') roleId: string) {
    try {
      const permissions = await this.adminService.getPagePermissions(roleId);

      return {
        success: true,
        data: permissions
      };
    } catch (error) {
      console.error('❌ [PAGE_ACCESS] Failed to load page permissions:', error);
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to load page permissions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ================== TYPE VISIBILITY PERMISSIONS ==================

  /**
   * GET /admin/permissions/role/:roleId/types
   * Get all types with isAllowed flags for a role
   */
  @Get('permissions/role/:roleId/types')
  async getRoleTypeVisibility(@Param('roleId') roleId: string) {
    try {
      return await this.adminService.getRoleTypeVisibility(roleId);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve role type visibility',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PUT /admin/permissions/role/:roleId/types
   * Replace all type visibility records for a role
   */
  @Put('permissions/role/:roleId/types')
  async updateRoleTypeVisibility(
    @Param('roleId') roleId: string,
    @Body() body: {
      allowedEnumTypes: string[];
      allowedCustomTypeIds: string[];
    },
  ) {
    try {
      const result = await this.adminService.updateRoleTypeVisibility(
        roleId,
        body.allowedEnumTypes,
        body.allowedCustomTypeIds,
      );

      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update role type visibility',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ================== PROJECT SCOPE PERMISSIONS ==================

  /**
   * GET /admin/permissions/role/:roleId/project-scope
   * Get project scope configuration for a role
   */
  @Get('permissions/role/:roleId/project-scope')
  async getRoleProjectScope(@Param('roleId') roleId: string) {
    try {
      return await this.adminService.getRoleProjectScope(roleId);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to retrieve role project scope',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * PUT /admin/permissions/role/:roleId/project-scope
   * Replace project scope configuration for a role
   */
  @Put('permissions/role/:roleId/project-scope')
  async updateRoleProjectScope(
    @Param('roleId') roleId: string,
    @Body() body: {
      enabled: boolean;
      assignedProjectIds?: string[];
      assignedBySource?: Record<string, string[]>;
    },
  ) {
    try {
      const result = await this.adminService.updateRoleProjectScope(
        roleId,
        body.enabled,
        body.assignedProjectIds || [],
        body.assignedBySource,
      );

      await this.adminService.invalidatePermissionCache();

      return result;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to update role project scope',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}