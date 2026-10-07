import { IsOptional, IsString, MaxLength, IsISO8601 } from 'class-validator';

export class UpdateSupplierProfileDto {
  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(34, { message: 'IBAN must be at most 34 characters' })
  iban?: string;

  @IsOptional()
  @IsString()
  officialName?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'noteDate must be a valid ISO 8601 date' })
  noteDate?: string;
}
