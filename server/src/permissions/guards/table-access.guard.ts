import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from '../services/access-control.service';
import { TABLE_ACCESS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class TableAccessGuard implements CanActivate {
  private readonly logger = new Logger(TableAccessGuard.name);

  constructor(
    private reflector: Reflector,
    private accessControlService: AccessControlService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tableAccess = this.reflector.get<{ tableId: string; action: string }>(
      TABLE_ACCESS_KEY,
      context.getHandler()
    );

    if (!tableAccess) {
      // No table access requirements specified
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      this.logger.warn('TableAccessGuard: User information not available in request');
      throw new ForbiddenException('Authentication required');
    }

    try {
      const { tableId, action } = tableAccess;
      const decision = await this.accessControlService.checkTableAccess(
        user.id,
        tableId,
        action
      );

      if (!decision.allowed) {
        this.logger.warn(
          `Table access denied: userId=${user.id}, table=${tableId}, action=${action}, reason=${decision.reason}`
        );
        throw new ForbiddenException(decision.reason);
      }

      this.logger.debug(
        `Table access granted: userId=${user.id}, table=${tableId}, action=${action}`
      );

      // Store table access info in request for potential use by downstream handlers
      request.tableAccess = { tableId, action, userId: user.id };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error('TableAccessGuard error:', error);
      throw new ForbiddenException('Permission check failed');
    }
  }
}