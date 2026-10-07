import { IsString, IsNotEmpty, MinLength, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ProjectStatus, ProjectBucket } from '@prisma/client';

export class CreateProjectDto {
  @IsEnum(ProjectBucket, { message: 'Bucket must be one of: TLINES_NE, TLINES_SE, TLINES_NW, CVW, TLINES_HQ, TLINES_TC' })
  @IsNotEmpty({ message: 'Bucket is required' })
  bucket: ProjectBucket;

  @IsString({ message: 'Project No must be a string' })
  @IsNotEmpty({ message: 'Project No is required' })
  @MinLength(1, { message: 'Project No must be at least 1 character long' })
  projectNo: string;

  @IsString({ message: 'Project name must be a string' })
  @IsNotEmpty({ message: 'Project name is required' })
  @MinLength(2, { message: 'Project name must be at least 2 characters long' })
  name: string;

  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  address: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Each type must be a string' })
  types?: string[];

  @IsOptional()
  @IsEnum(ProjectStatus, { message: 'Status must be PRE_PROJECT, IN_PROGRESS, or DONE' })
  status?: ProjectStatus;

  @IsOptional()
  @IsString()
  dropboxSection?: string;

  @IsOptional()
  @IsString()
  dropboxRegion?: string;

  @IsOptional()
  @IsString()
  dropboxStatus?: string;

  @IsOptional()
  @IsString()
  dropboxClientType?: string;

  @IsOptional()
  @IsString()
  clientName?: string;
}