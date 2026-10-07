import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional, IsBoolean } from 'class-validator';

export class CreateVendorDto {
  @IsString({ message: 'Vendor name must be a string' })
  @IsNotEmpty({ message: 'Vendor name is required' })
  @MinLength(2, { message: 'Vendor name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Vendor name cannot exceed 100 characters' })
  name: string;

  @IsString({ message: 'Vendor code must be a string' })
  @IsNotEmpty({ message: 'Vendor code is required' })
  @MinLength(2, { message: 'Vendor code must be at least 2 characters long' })
  @MaxLength(10, { message: 'Vendor code cannot exceed 10 characters' })
  code: string; // Manual vendor codes are now required (YSM, CBN, etc.)

  @IsOptional()
  @IsBoolean({ message: 'fixedMillworkCodes must be a boolean' })
  fixedMillworkCodes?: boolean; // Millwork PF codes follow the M01/M02/M03 order-type rule
}