import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean, IsDateString, IsEnum, IsInt } from 'class-validator';
import { ProjectHalf } from '@prisma/client';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {
  // All fields are inherited from CreateProjectDto as optional
  // Note: projectNo updates should be used carefully to maintain uniqueness

  @IsOptional()
  @IsBoolean({ message: 'isUrgent must be a boolean' })
  isUrgent?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'containerDate must be a valid ISO 8601 date string' })
  containerDate?: string;

  @IsOptional()
  @IsEnum(ProjectHalf, { message: 'halfOfYear must be FIRST_HALF or SECOND_HALF' })
  halfOfYear?: ProjectHalf;

  @IsOptional()
  @IsInt({ message: 'halfYear must be an integer' })
  halfYear?: number;
}