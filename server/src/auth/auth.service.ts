import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { TRUST_STOCK_TABLE_KEY } from '../trust-stock/trust-stock-columns';
import {
  AuthResponseDto,
  MeResponseDto,
  UserDto,
  RoleDto,
  PermissionDto,
  ColumnVisibilityDto,
} from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private readonly REFRESH_TTL_SHORT: number;
  private readonly REFRESH_TTL_LONG: number;
  private readonly RATE_LIMIT_MAX_ATTEMPTS: number;
  private readonly RATE_LIMIT_WINDOW_MINUTES: number;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Parse env-based TTLs (default: 1 day short, 30 days long)
    this.REFRESH_TTL_SHORT = this.parseTTL(
      this.configService.get('REFRESH_TTL_SHORT', '1d'),
    );
    this.REFRESH_TTL_LONG = this.parseTTL(
      this.configService.get('REFRESH_TTL_LONG', '30d'),
    );
    this.RATE_LIMIT_MAX_ATTEMPTS = parseInt(
      this.configService.get('RATE_LIMIT_MAX_ATTEMPTS', '5'),
      10,
    );
    this.RATE_LIMIT_WINDOW_MINUTES = parseInt(
      this.configService.get('RATE_LIMIT_WINDOW_MINUTES', '5'),
      10,
    );
  }

  /**
   * Parse TTL string like "1d", "30d", "12h" into milliseconds
   */
  private parseTTL(ttl: string): number {
    const match = ttl.match(/^(\d+)([dhm])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000; // fallback 30 days
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Check rate limit for IP + identifier combo.
   * Throws 429 if too many failed attempts.
   */
  private async checkRateLimit(ip: string, identifier: string): Promise<void> {
    const windowStart = new Date(
      Date.now() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    );

    const failedAttempts = await this.prismaService.loginAttempt.count({
      where: {
        ip,
        identifier: identifier.toLowerCase(),
        success: false,
        createdAt: { gte: windowStart },
      },
    });

    if (failedAttempts >= this.RATE_LIMIT_MAX_ATTEMPTS) {
      console.warn(`🚫 [RATE_LIMIT] Blocked login attempt from IP: ${ip}, identifier: ${identifier}`);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Çok fazla başarısız giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.',
          error: 'Too Many Requests',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Log a login attempt for audit & rate limiting
   */
  private async logLoginAttempt(
    ip: string,
    identifier: string,
    success: boolean,
  ): Promise<void> {
    await this.prismaService.loginAttempt.create({
      data: {
        ip,
        identifier: identifier.toLowerCase(),
        success,
      },
    });
  }

  /**
   * Reset failed attempts on successful login
   */
  private async resetFailedAttempts(
    ip: string,
    identifier: string,
  ): Promise<void> {
    const windowStart = new Date(
      Date.now() - this.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    );

    await this.prismaService.loginAttempt.deleteMany({
      where: {
        ip,
        identifier: identifier.toLowerCase(),
        success: false,
        createdAt: { gte: windowStart },
      },
    });
  }

  /**
   * Find user by identifier: email → username → phone (fallback chain)
   */
  private async findUserByIdentifier(identifier: string) {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // 1. Try exact email match
    let user = await this.prismaService.user.findUnique({
      where: { email: normalizedIdentifier },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
            roleColumnVisibility: { include: { table: true } },
          },
        },
      },
    });

    if (user) return user;

    // 2. Try exact username match
    user = await this.prismaService.user.findUnique({
      where: { username: normalizedIdentifier },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
            roleColumnVisibility: { include: { table: true } },
          },
        },
      },
    });

    if (user) return user;

    // 3. Phone match not implemented yet (no phone field in schema)
    // Future: normalize phone (remove spaces, +, -, parens) and match

    return null;
  }

  async login(
    loginDto: LoginDto,
    ip: string = '0.0.0.0',
  ): Promise<AuthResponseDto & { refreshToken: string; rememberMe?: boolean }> {
    const { identifier, password, rememberMe } = loginDto;
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Rate limit check
    await this.checkRateLimit(ip, normalizedIdentifier);

    // Find user by identifier (email or username)
    const user = await this.findUserByIdentifier(normalizedIdentifier);

    if (!user || !user.isActive || user.deletedAt) {
      // Log failed attempt
      await this.logLoginAttempt(ip, normalizedIdentifier, false);
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }

    // Verify password (do NOT trim password - spaces can be part of password)
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      // Log failed attempt
      await this.logLoginAttempt(ip, normalizedIdentifier, false);
      throw new UnauthorizedException('Kullanıcı adı veya şifre hatalı');
    }

    // Successful login - log success & reset fail counter
    await this.logLoginAttempt(ip, normalizedIdentifier, true);
    await this.resetFailedAttempts(ip, normalizedIdentifier);

    // Update last login time
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Determine refresh token TTL based on rememberMe
    const refreshTTL = rememberMe ? this.REFRESH_TTL_LONG : this.REFRESH_TTL_SHORT;

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshToken = await this.generateRefreshToken(user.id, refreshTTL);

    // Get full user data including pagePermissions, userAccessPolicy, isAdmin
    // (same as getMe() - ensures login response has all data frontend needs)
    const meData = await this.getMe(user.id);

    return {
      accessToken,
      ...meData,
      refreshToken,
      rememberMe,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    // A page opening fires several requests at once; each may refresh with the same cookie.
    // The first one rotates the token, so the others are still accepted for a short grace window.
    const matchingToken = await this.findRefreshToken(refreshToken, AuthService.ROTATION_GRACE_MS);

    if (!matchingToken || !matchingToken.user.isActive) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new access token
    const accessToken = this.generateAccessToken(
      matchingToken.user.id,
      matchingToken.user.email,
    );

    // Calculate remaining TTL from existing token
    const remainingTTL = matchingToken.expiresAt.getTime() - Date.now();
    const newTTL = Math.max(remainingTTL, this.REFRESH_TTL_SHORT); // At least short TTL

    // Generate new refresh token and revoke old one
    const newRefreshToken = await this.generateRefreshToken(matchingToken.user.id, newTTL);

    // keep the first revoke time, so the grace window isn't stretched by repeated refreshes
    if (!matchingToken.revokedAt) {
      await this.prismaService.refreshToken.update({
        where: { id: matchingToken.id },
        data: { revokedAt: new Date() },
      });
    }

    return {
      accessToken,
      refreshToken: newRefreshToken,
    } as { accessToken: string; refreshToken: string };
  }

  /** A refresh token rotated this recently is still accepted (parallel requests of one page load) */
  private static readonly ROTATION_GRACE_MS = 30_000;
  /** Sessions (devices / browsers) kept per user; older ones are revoked when a new one is issued */
  private static readonly MAX_SESSIONS_PER_USER = 20;

  /** Refresh tokens are random UUIDs, so a fast SHA-256 is enough (bcrypt is for passwords). */
  private static hashRefreshToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  /**
   * The stored token behind a refresh cookie ("userId.rawToken"; very old cookies are a bare UUID).
   * New tokens are found directly by their SHA-256. Tokens issued before that are bcrypt hashes:
   * those are checked newest first — the cookie is almost always the newest — until they rotate away.
   */
  private async findRefreshToken(cookie: string, graceMs = 0) {
    const dot = cookie.indexOf('.');
    const userId = dot > 0 ? cookie.substring(0, dot) : null;
    const raw = dot > 0 ? cookie.substring(dot + 1) : cookie;
    const usable = {
      expiresAt: { gte: new Date() },
      OR: [{ revokedAt: null }, ...(graceMs ? [{ revokedAt: { gte: new Date(Date.now() - graceMs) } }] : [])],
    };

    const direct = await this.prismaService.withRetry(() =>
      this.prismaService.refreshToken.findFirst({
        where: { ...usable, tokenHash: AuthService.hashRefreshToken(raw), ...(userId ? { userId } : {}) },
        include: { user: true },
      }),
    );
    if (direct) return direct;

    // bcrypt-era tokens only exist with a userId prefix worth scanning; never scan every user
    if (!userId) return null;
    const legacy = await this.prismaService.withRetry(() =>
      this.prismaService.refreshToken.findMany({
        where: { ...usable, userId, tokenHash: { startsWith: '$2' } },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        // the browser's cookie is one of the newest; an unknown cookie mustn't cost hundreds of bcrypt checks
        take: AuthService.MAX_SESSIONS_PER_USER * 2,
      }),
    );
    for (const token of legacy) {
      if (await bcrypt.compare(raw, token.tokenHash)) return token;
    }
    return null;
  }

  async logout(refreshToken: string): Promise<{ message: string }> {
    if (refreshToken) {
      const token = await this.findRefreshToken(refreshToken);
      if (token && !token.revokedAt) {
        await this.prismaService.refreshToken.update({
          where: { id: token.id },
          data: { revokedAt: new Date() },
        });
      }
    }

    return { message: 'Logged out successfully' };
  }

  async getMe(userId: string): Promise<MeResponseDto> {
    const user = await this.prismaService.withRetry(() =>
      this.prismaService.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
              roleColumnVisibility: { include: { table: true } },
              rolePageAccess: {
                include: {
                  page: true,
                },
              },
            },
          },
          userAccessPolicy: true,
        },
      }),
    );

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found');
    }

    // Create userAccessPolicy from role column visibility for easy frontend consumption
    const roleBasedPolicy = this.createRoleBasedPolicy(user.role.roleColumnVisibility);

    // Get page permissions from new RolePageAccess model using pageKey
    const pagePermissions: Record<string, boolean> = {};
    for (const pageAccess of user.role.rolePageAccess) {
      const pageKey = pageAccess.page.key;
      pagePermissions[pageKey] = pageAccess.hasAccess;
    }

    // Ensure all NAV_PAGES keys exist (fail-closed: missing = false)
    const navPageKeys = ['dashboard', 'operational_board', 'missing_extra', 'direct_order', 'suppliers_vendors', 'supplier_total', 'project_total', 'admin_roles_permissions', 'admin_activity_log', 'trust_expenses', 'expenses_p', 'expenses_direct_order', 'expenses_missing_extra'];
    for (const key of navPageKeys) {
      if (!pagePermissions.hasOwnProperty(key)) {
        pagePermissions[key] = false;
      }
    }
    // Legacy aliases
    pagePermissions.projects = pagePermissions.operational_board;
    pagePermissions.suppliers = pagePermissions.suppliers_vendors;
    pagePermissions.admin = pagePermissions.admin_roles_permissions;


    // Query type visibility for the user's role
    const typeVisibilityRecords = await this.prismaService.roleTypeVisibility.findMany({
      where: { roleId: user.roleId },
    });

    let allowedTypes: { enumTypes: string[] | null; customTypeIds: string[] | null } | null = null;
    if (typeVisibilityRecords.length > 0) {
      const enumTypes = typeVisibilityRecords.filter(r => r.typeEnum).map(r => r.typeEnum as string);
      const customTypeIds = typeVisibilityRecords.filter(r => r.customTypeId).map(r => r.customTypeId as string);
      allowedTypes = {
        enumTypes: enumTypes.length > 0 ? enumTypes : [],
        customTypeIds: customTypeIds.length > 0 ? customTypeIds : [],
      };
    }

    // Query project scope for the user's role
    const roleForScope = await this.prismaService.role.findUnique({
      where: { id: user.roleId },
      select: { projectScopeEnabled: true },
    });

    let projectScope: { enabled: boolean; projectIds: string[]; idsBySource?: Record<string, string[]> } | null = null;
    if (roleForScope?.projectScopeEnabled) {
      const projectScopeRecords = await this.prismaService.roleProjectScope.findMany({
        where: { roleId: user.roleId },
        select: { projectId: true, sourceType: true },
      });
      const idsBySource: Record<string, string[]> = {};
      for (const r of projectScopeRecords) {
        if (!idsBySource[r.sourceType]) idsBySource[r.sourceType] = [];
        idsBySource[r.sourceType].push(r.projectId);
      }
      projectScope = { enabled: true, projectIds: idsBySource['project'] || [], idsBySource };
    }

    // If user has individual access policy, merge with role-based policy
    const finalPolicy = user.userAccessPolicy
      ? { ...this.mergeUserAccessPolicy(user.userAccessPolicy, roleBasedPolicy, pagePermissions), allowedTypes, projectScope }
      : { ...roleBasedPolicy, pagePermissions, allowedTypes, projectScope };

    // 🔍 AUTH_ME_POLICY_PROOF - Log exactly what policy is being returned to user

    return {
      user: this.transformUser(user),
      role: this.transformRole(user.role),
      permissions: this.transformPermissions(user.role.rolePermissions),
      columnVisibility: this.transformColumnVisibility(user.role.roleColumnVisibility),
      userAccessPolicy: finalPolicy,
      isAdmin: !!pagePermissions['admin_roles_permissions'], // DB-driven: true if role has admin page access
    };
  }

  private generateAccessToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
    });
  }

  private async generateRefreshToken(
    userId: string,
    ttlMs?: number,
  ): Promise<string> {
    const rawToken = uuidv4();
    const tokenHash = AuthService.hashRefreshToken(rawToken);
    const expiresAt = new Date(Date.now() + (ttlMs || this.REFRESH_TTL_LONG));

    const created = await this.prismaService.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    // Cap the user's open sessions: tokens beyond the newest MAX are revoked (that device logs in again).
    // Only sets revokedAt on the user's own refresh tokens; nothing else is touched.
    const keep = await this.prismaService.refreshToken.findMany({
      where: { userId, revokedAt: null, expiresAt: { gte: new Date() } },
      orderBy: { createdAt: 'desc' },
      take: AuthService.MAX_SESSIONS_PER_USER,
      select: { id: true },
    });
    await this.prismaService.refreshToken.updateMany({
      where: { userId, revokedAt: null, id: { notIn: [created.id, ...keep.map(k => k.id)] } },
      data: { revokedAt: new Date() },
    });

    // Embed userId as prefix so refresh lookup can filter by userId (O(1) instead of O(N) bcrypt loop)
    return `${userId}.${rawToken}`;
  }

  private transformUser(user: any): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      forcePasswordChange: user.forcePasswordChange,
      createdAt: user.createdAt,
    };
  }

  private transformRole(role: any): RoleDto {
    return {
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
      isActive: role.isActive,
    };
  }

  private transformPermissions(rolePermissions: any[]): PermissionDto[] {
    return rolePermissions.map(rp => ({
      key: rp.permission.key,
      module: rp.permission.module,
      action: rp.permission.action,
    }));
  }

  private transformColumnVisibility(columnVisibility: any[]): ColumnVisibilityDto[] {
    return columnVisibility.map(cv => ({
      columnKey: cv.columnKey,
      isHidden: cv.isHidden,
      isReadOnly: cv.isReadOnly,
    }));
  }

  private transformUserAccessPolicy(userAccessPolicy: any) {
    return {
      columnsHidden: userAccessPolicy.columnsHidden || [],
      columnsReadOnly: userAccessPolicy.columnsReadOnly || [],
      rowScopes: userAccessPolicy.rowScopes || {},
      modulePermissions: userAccessPolicy.modulePermissions || {},
    };
  }

  private createRoleBasedPolicy(roleColumnVisibility: any[]): any {
    // Group by table key for multi-table support
    const defaultColumns = { hidden: [], readOnly: [] };
    const supplierColumns = {
      'supplier-p-sheet': { hidden: [], readOnly: [] },
      'supplier-me-sheet': { hidden: [], readOnly: [] },
      'supplier-do-sheet': { hidden: [], readOnly: [] },
      [TRUST_STOCK_TABLE_KEY]: { hidden: [], readOnly: [] },
    };

    roleColumnVisibility.forEach(cv => {
      const tableKey = cv.table?.key || null;

      // Projects permissions: tableId is null (legacy) or table key is 'operational-board-grid'
      if (!tableKey || tableKey === 'operational-board-grid') {
        if (cv.isHidden) {
          defaultColumns.hidden.push(cv.columnKey);
        } else if (cv.isReadOnly) {
          defaultColumns.readOnly.push(cv.columnKey);
        }
      }
      // Supplier table permissions (matched by table registry key)
      else if (supplierColumns[tableKey]) {
        if (cv.isHidden) {
          supplierColumns[tableKey].hidden.push(cv.columnKey);
        } else if (cv.isReadOnly) {
          supplierColumns[tableKey].readOnly.push(cv.columnKey);
        }
      }
    });

    return {
      // Legacy format for backward compatibility (Projects)
      columnsHidden: defaultColumns.hidden,
      columnsReadOnly: defaultColumns.readOnly,
      rowScopes: {},
      modulePermissions: {},
      // New multi-table format (Suppliers)
      tablePermissions: {
        'supplier-p-sheet': {
          columnsHidden: supplierColumns['supplier-p-sheet'].hidden,
          columnsReadOnly: supplierColumns['supplier-p-sheet'].readOnly,
        },
        'supplier-me-sheet': {
          columnsHidden: supplierColumns['supplier-me-sheet'].hidden,
          columnsReadOnly: supplierColumns['supplier-me-sheet'].readOnly,
        },
        'supplier-do-sheet': {
          columnsHidden: supplierColumns['supplier-do-sheet'].hidden,
          columnsReadOnly: supplierColumns['supplier-do-sheet'].readOnly,
        },
        [TRUST_STOCK_TABLE_KEY]: {
          columnsHidden: supplierColumns[TRUST_STOCK_TABLE_KEY].hidden,
          columnsReadOnly: supplierColumns[TRUST_STOCK_TABLE_KEY].readOnly,
        },
      }
    };
  }

  private mergeUserAccessPolicy(userAccessPolicy: any, roleBasedPolicy: any, pagePermissions: any): any {
    // User-specific policy overrides role-based policy
    return {
      columnsHidden: [...roleBasedPolicy.columnsHidden, ...(userAccessPolicy.columnsHidden || [])],
      columnsReadOnly: [...roleBasedPolicy.columnsReadOnly, ...(userAccessPolicy.columnsReadOnly || [])],
      pagePermissions: pagePermissions || { operationalBoardView: true, createProject: true, canAddItems: true, canManageMasterData: true },
      rowScopes: { ...roleBasedPolicy.rowScopes, ...(userAccessPolicy.rowScopes || {}) },
      modulePermissions: { ...roleBasedPolicy.modulePermissions, ...(userAccessPolicy.modulePermissions || {}) },
      // per-table rules (Supplier sheets, Trust Stock) are role-only; keep them for users with a personal policy too
      tablePermissions: roleBasedPolicy.tablePermissions,
    };
  }

  async getClients(): Promise<UserDto[]> {
    const clients = await this.prismaService.user.findMany({
      where: {
        isActive: true,
        role: {
          name: 'CLIENT',
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return clients.map(client => this.transformUser(client));
  }

  async activateUser(token: string, newPassword: string): Promise<{ success: boolean; message: string; loginData?: any }> {
    // Find matching invite token by comparing bcrypt hashes
    const allInviteTokens = await this.prismaService.inviteToken.findMany({
      where: {
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true,
                  },
                },
                roleColumnVisibility: { include: { table: true } },
              },
            },
          },
        },
      },
    });

    let validToken = null;
    for (const tokenRecord of allInviteTokens) {
      const isValid = await bcrypt.compare(token, tokenRecord.tokenHash);
      if (isValid) {
        validToken = tokenRecord;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Invalid or expired activation token');
    }

    const { user } = validToken;

    if (user.isActive) {
      throw new ConflictException('User account is already activated');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user: set password, activate account, clear force password change
    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        isActive: true,
        forcePasswordChange: false,
        lastLoginAt: new Date(),
      },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
            roleColumnVisibility: { include: { table: true } },
          },
        },
      },
    });

    // Mark token as used
    await this.prismaService.inviteToken.update({
      where: { id: validToken.id },
      data: { usedAt: new Date() },
    });

    // Generate login tokens (same method as login flow)
    const accessToken = this.generateAccessToken(updatedUser.id, updatedUser.email);

    const refreshToken = await this.generateRefreshToken(updatedUser.id);

    // Get full user data including pagePermissions, userAccessPolicy, isAdmin
    const meData = await this.getMe(updatedUser.id);

    const loginData = {
      accessToken,
      ...meData,
    };

    return {
      success: true,
      message: 'Account activated successfully',
      loginData: { ...loginData, refreshToken },
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    // Find user
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new NotFoundException('User not found or inactive');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and clear force password change flag
    await this.prismaService.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        forcePasswordChange: false,
        lastLoginAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
