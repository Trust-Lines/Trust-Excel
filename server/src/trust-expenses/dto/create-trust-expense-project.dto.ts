import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { ProjectBucket } from '@prisma/client';

export class CreateTrustExpenseProjectDto {
  @IsEnum(ProjectBucket)
  bucket: ProjectBucket;

  @IsString()
  @IsNotEmpty()
  projectNo: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  types?: string[];

  @IsBoolean()
  @IsOptional()
  isUrgent?: boolean;

  @IsDateString()
  @IsOptional()
  containerDate?: string;
}
