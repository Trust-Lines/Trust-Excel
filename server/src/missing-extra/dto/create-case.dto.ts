import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ProjectBucket, CaseType } from '@prisma/client';

export class CreateMissingExtraCaseDto {
  // Mode 1: From existing project
  @IsOptional()
  @IsString({ message: 'Base project ID must be a string' })
  baseProjectId?: string;

  // Mode 2: Legacy/manual project (optional - only required if baseProjectId not provided)
  @IsOptional()
  @IsString({ message: 'Legacy project number must be a string' })
  legacyProjectNo?: string;

  @IsOptional()
  @IsString({ message: 'Legacy project name must be a string' })
  legacyProjectName?: string;

  // Optional custom case index (if not provided, auto-incremented)
  @IsOptional()
  @IsNumber({}, { message: 'Case index must be a number' })
  caseIndex?: number;

  @IsEnum(ProjectBucket, { message: 'Section must be one of: TLINES_NE, TLINES_SE, TLINES_NW, CVW, TLINES_HQ, TLINES_TC' })
  @IsNotEmpty({ message: 'Section is required' })
  section: ProjectBucket;

  @IsEnum(CaseType, { message: 'Case type must be one of: REPLACEMENT, EXTRA, MISSING' })
  @IsNotEmpty({ message: 'Case type is required' })
  caseType: CaseType;

  @IsArray({ message: 'Types must be an array' })
  @IsString({ each: true, message: 'Each type must be a string' })
  types: string[];
}