import { IsEmail, IsString, IsArray, IsOptional, IsObject } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsString()
  roleId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  columnsHidden?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  columnsReadOnly?: string[];

  @IsObject()
  @IsOptional()
  rowScopes?: any;
}

export class InviteUserResponseDto {
  success: boolean;
  userId: string;
  tokenExpiry: Date;
  emailSent: boolean;
  message?: string;
}