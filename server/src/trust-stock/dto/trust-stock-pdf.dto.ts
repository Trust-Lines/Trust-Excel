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
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() dimensions?: string | null;
  /** Confirmed received in the warehouse; null = back to pending verification */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() @Min(0) receivedQuantity?: number | null;
  @IsOptional() @IsNumber() @Min(0) quantity?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() unitPrice?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() totalPrice?: number | null;
}

export class CreateStockUsageDto {
  @IsString() @IsNotEmpty() projectItemId: string;
  @IsString() @IsNotEmpty() productId: string;
  @IsNumber() @Min(0.01) quantity: number;
}

export class StockMovementLineDto {
  @IsString() @IsNotEmpty() productId: string;
  @IsOptional() @IsNumber() @Min(0) take?: number;
  @IsOptional() @IsNumber() @Min(0) reserve?: number;
  @IsOptional() @IsNumber() @Min(0) return?: number;
  @IsOptional() @IsString() note?: string;
}

/** Several stock movements for one Projects row, saved together. */
export class StockMovementsDto {
  @IsString() @IsNotEmpty() projectItemId: string;
  /** Who took / returned / reserved the stock */
  @IsString() @IsNotEmpty() takenBy: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => StockMovementLineDto) lines: StockMovementLineDto[];
}
