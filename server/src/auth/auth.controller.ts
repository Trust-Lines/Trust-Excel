import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto, MeResponseDto, UserDto } from './dto/auth-response.dto';
import { ActivateUserDto, ChangePasswordDto, ActivationResponseDto } from './dto/activate-user.dto';
import { CookieHelper } from './cookie.helper';

@Controller('auth')
export class AuthController {
  private readonly cookieHelper: CookieHelper;

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    this.cookieHelper = new CookieHelper(configService);
  }

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } }) // Stricter: 10 login attempts per 60s (auth.service has its own rate limit too)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<AuthResponseDto, 'refreshToken'>> {
    // Extract client IP (trust proxy is enabled in main.ts)
    const ip = request.ip || request.socket?.remoteAddress || '0.0.0.0';

    const result = await this.authService.login(loginDto, ip);
    const { refreshToken, rememberMe, ...authResponse } = result;

    // Set refresh token as httpOnly cookie with TTL based on rememberMe
    this.cookieHelper.setRefreshTokenCookie(response, refreshToken, rememberMe);

    return authResponse;
  }

  @Post('refresh')
  @SkipThrottle() // Never throttle token refresh - would lock users out
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ accessToken: string }> {
    const refreshToken = request.cookies?.refreshToken;
    const result = await this.authService.refreshAccessToken(refreshToken);
    const { refreshToken: newRefreshToken, ...tokenResponse } = result as {
      accessToken: string;
      refreshToken: string;
    };

    // Guard: if response was already sent (e.g. proxy timeout during slow bcrypt loop), abort
    if (response.headersSent) {
      return tokenResponse;
    }

    // Set new refresh token as httpOnly cookie
    this.cookieHelper.setRefreshTokenCookie(response, newRefreshToken, true);

    return tokenResponse;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    const refreshToken = request.cookies?.refreshToken;
    const result = await this.authService.logout(refreshToken);

    // Clear refresh token cookie
    this.cookieHelper.clearRefreshTokenCookie(response);

    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Req() request: Request): Promise<MeResponseDto> {
    const user = request.user as any;
    return this.authService.getMe(user.userId);
  }

  @Get('clients')
  @UseGuards(JwtAuthGuard)
  async getClients(): Promise<UserDto[]> {
    return this.authService.getClients();
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  async activateUser(
    @Body() activateUserDto: ActivateUserDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ActivationResponseDto> {
    try {
      const result = await this.authService.activateUser(
        activateUserDto.token,
        activateUserDto.newPassword,
      );

      if (result.loginData && result.loginData.refreshToken) {
        const { refreshToken, ...loginResponse } = result.loginData;

        // Set refresh token as httpOnly cookie
        this.cookieHelper.setRefreshTokenCookie(response, refreshToken);

        return {
          success: result.success,
          message: result.message,
          accessToken: loginResponse.accessToken,
          user: loginResponse.user,
          role: loginResponse.role,
          permissions: loginResponse.permissions,
          columnVisibility: loginResponse.columnVisibility,
          userAccessPolicy: loginResponse.userAccessPolicy,
          isAdmin: loginResponse.isAdmin,
        };
      }

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Activation failed',
      };
    }
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: Request,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const user = request.user as any;
      const result = await this.authService.changePassword(
        user.userId,
        changePasswordDto.currentPassword,
        changePasswordDto.newPassword,
      );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Password change failed',
      };
    }
  }

}
