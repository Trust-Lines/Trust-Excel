import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { CreateMissingExtraCaseDto } from './create-case.dto';

export class UpdateMissingExtraCaseDto extends PartialType(CreateMissingExtraCaseDto) {
  // All fields from CreateMissingExtraCaseDto become optional automatically

  @IsOptional()
  @IsBoolean({ message: 'isUrgent must be a boolean' })
  isUrgent?: boolean;

  @IsOptional()
  @IsDateString({}, { message: 'containerDate must be a valid ISO 8601 date string' })
  containerDate?: string;
}