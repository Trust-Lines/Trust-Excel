import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Cleans up expired/revoked tokens and old login attempts daily.
 * Prevents the refresh_tokens and login_attempts tables from growing unbounded,
 * which would cause O(N*bcrypt) scans in refreshAccessToken/logout to hang.
 */
@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);
  private running = false; // Overlap guard

  constructor(private readonly prisma: PrismaService) {}

  /** Daily at 2:00 AM — clean expired/revoked refresh tokens */
  @Cron('0 2 * * *')
  async cleanupTokens(): Promise<void> {
    if (this.running) {
      this.logger.warn('TOKEN_CLEANUP: skipped (already running)');
      return;
    }
    this.running = true;
    const start = Date.now();

    try {
      // 1. Delete expired refresh tokens
      const expiredResult = await this.prisma.refreshToken.deleteMany({
        where: { expiresAt: { lt: new Date() } },
      });

      // 2. Delete revoked refresh tokens older than 1 day (keep recent for audit)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const revokedResult = await this.prisma.refreshToken.deleteMany({
        where: {
          revokedAt: { not: null, lt: oneDayAgo },
        },
      });

      // 3. Delete login attempts older than 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const loginResult = await this.prisma.loginAttempt.deleteMany({
        where: { createdAt: { lt: sevenDaysAgo } },
      });

      // 4. Delete used invite tokens older than 7 days
      const inviteResult = await this.prisma.inviteToken.deleteMany({
        where: {
          OR: [
            { usedAt: { not: null }, createdAt: { lt: sevenDaysAgo } },
            { expiresAt: { lt: new Date() } },
          ],
        },
      });

      this.logger.log(
        `TOKEN_CLEANUP: expired=${expiredResult.count} revoked=${revokedResult.count} ` +
        `loginAttempts=${loginResult.count} inviteTokens=${inviteResult.count} (${Date.now() - start}ms)`,
      );
    } catch (error) {
      this.logger.error('TOKEN_CLEANUP: failed', error.message);
    } finally {
      this.running = false;
    }
  }
}
