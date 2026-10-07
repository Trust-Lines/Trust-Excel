import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * RolesGuard - Now purely checks that user has an active role.
 * All authorization is DB-driven via PageAccessGuard / RoleTableAccess.
 * No hardcoded role-name checks.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('User role information not available');
    }

    // Only check that role is active - specific permissions are handled by PageAccessGuard
    if (!user.role.isActive) {
      throw new ForbiddenException('Your role is currently inactive. Please contact your administrator.');
    }

    return true;
  }
}
