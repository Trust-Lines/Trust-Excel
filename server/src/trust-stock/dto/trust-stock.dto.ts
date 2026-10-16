import { IsString, IsOptional, IsNotEmpty, IsEnum, IsNumber, IsObject, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { ProjectItemType, ItemStatus, SignStatus } from '@prisma/client';

const toNumberOrNull = ({ value }: { value: any }) => {
  if (value === undefined) return undefined;
  if (value === '' || value === null) return null;
  return Number(value);
};

export class CreateTrustStockGroupDto {
  /** e.g. "STOCK 3" — left empty, the next free "STOCK n" is used */
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() notes?: string;
}

export class UpdateTrustStockGroupDto {
  @IsOptional() @IsString() @IsNotEmpty() code?: string;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() notes?: string;
  /** Sent by the shared table's 'Edit Types'; a stock group's types are just its items, so it's ignored */
  @IsOptional() @IsString({ each: true }) types?: string[];
}

/** All item fields are optional; null clears a value. */
export class TrustStockItemDto {
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsEnum(ProjectItemType) type?: ProjectItemType | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() customTypeId?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() vendorId?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() pfCode?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() orderNo?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() orderType?: string | null;
  @IsOptional() @IsEnum(SignStatus) pfSignStatus?: SignStatus;
  @IsOptional() @IsEnum(SignStatus) poSignStatus?: SignStatus;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsEnum(ItemStatus) status?: ItemStatus | null;

  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() std?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() etd?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() rtr?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() rtd?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() rdy?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() ftd?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() snd?: string | null;

  @IsOptional() @Transform(toNumberOrNull) @ValidateIf((_, v) => v !== null) @IsNumber() pfUsd?: number | null;
  @IsOptional() @Transform(toNumberOrNull) @ValidateIf((_, v) => v !== null) @IsNumber() pfTl?: number | null;
  @IsOptional() @Transform(toNumberOrNull) @ValidateIf((_, v) => v !== null) @IsNumber() invoice?: number | null;
  @IsOptional() @Transform(toNumberOrNull) @ValidateIf((_, v) => v !== null) @IsNumber() invoiceTl?: number | null;
  @IsOptional() @Transform(toNumberOrNull) @ValidateIf((_, v) => v !== null) @IsNumber() paidUsd1?: number | null;
  @IsOptional() @Transform(toNumberOrNull) @ValidateIf((_, v) => v !== null) @IsNumber() paidUsd2?: number | null;
  @IsOptional() @Transform(toNumberOrNull) @ValidateIf((_, v) => v !== null) @IsNumber() paidTl1?: number | null;
  @IsOptional() @Transform(toNumberOrNull) @ValidateIf((_, v) => v !== null) @IsNumber() paidTl2?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() paidUsd1Date?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() paidUsd2Date?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() paidTl1Date?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() paidTl2Date?: string | null;

  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() paymentRule?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() statusNote?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() description?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsObject() priceNotes?: Record<string, string> | null;
}
