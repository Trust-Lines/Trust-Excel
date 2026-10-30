import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { createHash, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const sha256 = (s: string) => createHash('sha256').update(s).digest();

/**
 * Bearer JWT (the app's own users) — or, for the other system that reads/writes this API
 * server-to-server, an `X-API-Key` header.
 *
 * Integration key: INTEGRATION_API_KEY (comma-separated, so a new key can be added before the
 * old one is removed) acts as the user INTEGRATION_USER_EMAIL. That user is an ordinary user
 * with an ordinary role, so what the other system may see and change is set in Admin → Roles
 * exactly like for a person, and every change it makes is logged under that user.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers?.['x-api-key'];
    if (typeof apiKey === 'string' && apiKey) {
      req.user = await this.integrationUser(apiKey);
      return true;
    }
    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any) {
    if (err || !user) {
      throw new UnauthorizedException('Access token is invalid or expired');
    }
    return user;
  }

  private async integrationUser(apiKey: string) {
    const keys = (process.env.INTEGRATION_API_KEY || '').split(',').map(k => k.trim()).filter(k => k.length >= 32);
    const email = (process.env.INTEGRATION_USER_EMAIL || '').trim();
    const given = sha256(apiKey);
    if (!email || !keys.some(k => timingSafeEqual(sha256(k), given))) {
      throw new UnauthorizedException('Invalid API key');
    }
    // same shape as JwtStrategy.validate
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, isActive: true },
      include: {
        role: {
          include: {
            rolePermissions: { include: { permission: true } },
            roleColumnVisibility: true,
            rolePageAccess: { include: { page: true } },
          },
        },
      },
    });
    if (!user) throw new UnauthorizedException('Integration user is missing or inactive');
    return { id: user.id, userId: user.id, email: user.email, roleId: user.roleId, role: user.role };
  }
}
