import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { ProjectBucket, ProjectStatus } from '@prisma/client';

export class CreateDirectOrderProjectDto {
  @IsOptional()
  @IsString()
  projectNo?: string; // Optional, will be auto-generated if not provided

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNotEmpty()
  @IsEnum(ProjectBucket)
  bucket: ProjectBucket;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

export class UpdateDirectOrderProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsBoolean({ message: 'isUrgent must be a boolean' })
  isUrgent?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'containerDate must be a valid ISO 8601 date string' })
  containerDate?: string;
}