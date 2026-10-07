import { IsArray, ArrayNotEmpty, IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { ProjectHalf } from '@prisma/client';

export class BulkAssignHalfDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'projectIds must contain at least one project id' })
  @IsString({ each: true, message: 'Each projectId must be a string' })
  projectIds: string[];

  @IsOptional()
  @IsEnum(ProjectHalf, { message: 'halfOfYear must be FIRST_HALF or SECOND_HALF' })
  halfOfYear?: ProjectHalf | null;

  @IsOptional()
  @IsInt({ message: 'halfYear must be an integer' })
  halfYear?: number | null;
}
