import { IsArray, IsBoolean, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PagePermissionsDto {
  @IsBoolean()
  operationalBoardView: boolean;

  @IsBoolean()
  createProject: boolean;
}

export class UpdateRolePolicyDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columnsHidden?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columnsReadOnly?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PagePermissionsDto)
  pagePermissions?: PagePermissionsDto;
}

export class RolePolicyResponseDto {
  @IsArray()
  @IsString({ each: true })
  columnsHidden: string[];

  @IsArray()
  @IsString({ each: true })
  columnsReadOnly: string[];

  @ValidateNested()
  @Type(() => PagePermissionsDto)
  pagePermissions: PagePermissionsDto;
}

export class ColumnDefinitionDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsString()
  group: string;

  @IsString()
  width: string;

  @IsBoolean()
  isMoney: boolean;

  @IsBoolean()
  isEditableByDefault: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class RoleWithPolicyDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsBoolean()
  isSystem: boolean;

  @IsBoolean()
  isActive: boolean;

  @ValidateNested()
  @Type(() => RolePolicyResponseDto)
  policy: RolePolicyResponseDto;
}