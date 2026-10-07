import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from '../admin/admin.service';

/**
 * Public supplier permissions endpoint.
 * Any authenticated user can fetch their own role's supplier permissions.
 * NOT behind admin guard — PM, FINANCE, etc. can all access.
 */
@Controller('permissions')
@UseGuards(JwtAuthGuard)
export class SupplierPermissionsController {
  constructor(private adminService: AdminService) {}

  @Get('supplier/my-permissions')
  async getMySupplierPermissions(@Request() req) {
    const roleId = req.user?.roleId;
    const roleName = req.user?.role?.name;


    if (!roleId) {
      return {
        success: true,
        data: { tableActionsByKey: {}, columnRulesByKey: {} },
      };
    }

    const permissions = await this.adminService.getSupplierPermissions(roleId);


    return {
      success: true,
      data: permissions,
    };
  }
}
