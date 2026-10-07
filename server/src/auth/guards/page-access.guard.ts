import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { PAGE_ACCESS_KEY } from '../decorators/page-access.decorator';

@Injectable()
export class PageAccessGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPageKey = this.reflector.getAllAndOverride<string>(PAGE_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No page access required for this endpoint
    if (!requiredPageKey) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException({
        code: 'ACCESS_DENIED',
        pageKey: requiredPageKey,
        message: 'User role information not available',
      });
    }

    // No role-name bypass - all authorization is DB-driven
    // ADMIN roles should have hasAccess=true for all pages in the DB

    // Check page access from database
    const pageRegistry = await this.prisma.pageRegistry.findUnique({
      where: { key: requiredPageKey },
    });

    if (!pageRegistry) {
      // Page not registered yet - deny by default (fail-closed)
      throw new ForbiddenException({
        code: 'ACCESS_DENIED',
        pageKey: requiredPageKey,
        message: `Page '${requiredPageKey}' access denied - page not configured`,
      });
    }

    const pageAccess = await this.prisma.rolePageAccess.findUnique({
      where: {
        roleId_pageId: {
          roleId: user.role.id,
          pageId: pageRegistry.id,
        },
      },
    });

    // If no record exists, deny access (fail-closed: page key not in DB = false)
    if (!pageAccess || !pageAccess.hasAccess) {
      throw new ForbiddenException({
        code: 'ACCESS_DENIED',
        pageKey: requiredPageKey,
        message: `Access denied to page '${requiredPageKey}'`,
      });
    }

    return true;
  }
}
