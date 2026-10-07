import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessControlService } from '../services/access-control.service';
import { PAGE_ACCESS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PageAccessGuard implements CanActivate {
  private readonly logger = new Logger(PageAccessGuard.name);

  constructor(
    private reflector: Reflector,
    private accessControlService: AccessControlService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const pageIds = this.reflector.get<string[]>(PAGE_ACCESS_KEY, context.getHandler());

    if (!pageIds || pageIds.length === 0) {
      // No page access requirements specified
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      this.logger.warn('PageAccessGuard: User information not available in request');
      throw new ForbiddenException('Authentication required');
    }

    try {
      // Check access to all required pages
      for (const pageId of pageIds) {
        const decision = await this.accessControlService.checkPageAccess(user.id, pageId);

        if (!decision.allowed) {
          this.logger.warn(
            `Page access denied: userId=${user.id}, pageId=${pageId}, reason=${decision.reason}`
          );
          throw new ForbiddenException(decision.reason);
        }
      }

      this.logger.debug(`Page access granted: userId=${user.id}, pages=[${pageIds.join(', ')}]`);
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error('PageAccessGuard error:', error);
      throw new ForbiddenException('Permission check failed');
    }
  }
}