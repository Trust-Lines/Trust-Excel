import { IsString, MinLength } from 'class-validator';

export class ActivateUserDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
  newPassword: string;
}

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalı' })
  newPassword: string;
}

export class ActivationResponseDto {
  success: boolean;
  message: string;
  accessToken?: string;
  user?: any;
  role?: any;
  permissions?: any[];
  columnVisibility?: any[];
  userAccessPolicy?: any;
  isAdmin?: boolean;
}
