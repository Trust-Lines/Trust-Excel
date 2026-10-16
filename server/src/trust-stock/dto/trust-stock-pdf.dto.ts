import { IsString, IsOptional, IsNotEmpty, IsIn, IsNumber, IsArray, ValidateNested, ArrayMinSize, Min, ValidateIf, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectItemType } from '@prisma/client';

export class ImportPfProductDto {
  @IsString() @IsNotEmpty() itemCode: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() category?: string | null;
  @IsNumber() @Min(0) quantity: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() unitPrice?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() totalPrice?: number | null;
}

/** What the preview screen sends back (parsed values, possibly corrected by the user). */
export class ImportPfDto {
  @IsString() @IsNotEmpty() stockCode: string;
  @IsString() @IsNotEmpty() pfCode: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() vendorId?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsEnum(ProjectItemType) type?: ProjectItemType | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() orderNo?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() pfDate?: string | null;
  @IsIn(['USD', 'TL', 'EUR']) currency: 'USD' | 'TL' | 'EUR';
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() totalPrice?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() paymentRule?: string | null;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ImportPfProductDto) products: ImportPfProductDto[];
}

export class UpdateStockProductDto {
  @IsOptional() @IsString() @IsNotEmpty() itemCode?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() @Min(0) quantity?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() unitPrice?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() totalPrice?: number | null;
}

export class CreateStockUsageDto {
  @IsString() @IsNotEmpty() projectItemId: string;
  @IsString() @IsNotEmpty() productId: string;
  @IsNumber() @Min(0.01) quantity: number;
}
