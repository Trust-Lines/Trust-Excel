import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

export class CookieHelper {
  private readonly REFRESH_TTL_SHORT: number;
  private readonly REFRESH_TTL_LONG: number;

  constructor(private configService: ConfigService) {
    this.REFRESH_TTL_SHORT = this.parseTTL(
      this.configService.get('REFRESH_TTL_SHORT', '1d'),
    );
    this.REFRESH_TTL_LONG = this.parseTTL(
      this.configService.get('REFRESH_TTL_LONG', '30d'),
    );
  }

  private parseTTL(ttl: string): number {
    const match = ttl.match(/^(\d+)([dhm])$/);
    if (!match) return 30 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    switch (match[2]) {
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'm': return value * 60 * 1000;
      default: return 30 * 24 * 60 * 60 * 1000;
    }
  }

  private getCookieOptions(maxAge?: number) {
    const isProduction = this.configService.get('NODE_ENV') === 'production';

    return {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: maxAge || this.REFRESH_TTL_LONG,
    };
  }

  setRefreshTokenCookie(
    response: Response,
    refreshToken: string,
    rememberMe?: boolean,
  ): void {
    const maxAge = rememberMe ? this.REFRESH_TTL_LONG : this.REFRESH_TTL_SHORT;
    response.cookie('refreshToken', refreshToken, this.getCookieOptions(maxAge));
  }

  clearRefreshTokenCookie(response: Response): void {
    const options = this.getCookieOptions();
    const { maxAge, ...clearOptions } = options;
    response.clearCookie('refreshToken', clearOptions);
  }
}
