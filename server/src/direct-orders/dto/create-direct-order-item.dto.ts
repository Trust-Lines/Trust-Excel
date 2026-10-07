import { IsString, IsOptional, IsEnum, IsISO8601, ValidateIf, IsObject } from 'class-validator';
import { ProjectItemType, SignStatus, ItemStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

const toNum = ({ value }: { value: any }) => {
  if (value === null || value === undefined || value === '') return undefined;
  const n = parseFloat(String(value));
  return isNaN(n) ? undefined : n;
};

const toNumNullable = ({ value }: { value: any }) => {
  if (value === null) return null;
  if (value === undefined || value === '') return undefined;
  const n = parseFloat(String(value));
  return isNaN(n) ? undefined : n;
};

export class CreateDirectOrderItemDto {
  @IsOptional()
  @IsEnum(ProjectItemType)
  type?: ProjectItemType;

  @IsOptional()
  @IsString()
  customTypeId?: string;

  @IsOptional()
  @IsString()
  pfCode?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  orderTypeId?: string;

  @IsOptional()
  @IsString()
  orderType?: string;

  @IsOptional()
  @IsEnum(SignStatus, { message: 'PF Sign Status must be one of: NOT_SIGNED, READY_TO_SIGN, SIGNED' })
  pfSignStatus?: SignStatus;

  @IsOptional()
  @IsEnum(SignStatus, { message: 'PO Sign Status must be one of: NOT_SIGNED, READY_TO_SIGN, SIGNED' })
  poSignStatus?: SignStatus;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsISO8601()
  std?: string;

  @IsOptional()
  @IsISO8601()
  etd?: string;

  @IsOptional()
  @IsISO8601()
  rtd?: string;

  @IsOptional()
  @IsISO8601()
  ftd?: string;

  @IsOptional()
  @IsISO8601()
  rtr?: string;

  @IsOptional()
  @IsISO8601()
  rdy?: string;

  @IsOptional()
  @IsISO8601()
  snd?: string;

  @IsOptional()
  @IsString()
  containerNo?: string;

  @IsOptional()
  @IsString()
  paymentRule?: string;

  @IsOptional()
  @Transform(toNum)
  pfUsd?: number;

  @IsOptional()
  @Transform(toNum)
  pfTl?: number;

  @IsOptional()
  @Transform(toNum)
  paidUsd1?: number;

  @IsOptional()
  @Transform(toNum)
  paidUsd2?: number;

  @IsOptional()
  @Transform(toNum)
  paidTl1?: number;

  @IsOptional()
  @Transform(toNum)
  paidTl2?: number;

  @IsOptional()
  @Transform(toNumNullable)
  invoice?: number | null;

  @IsOptional()
  @Transform(toNumNullable)
  invoiceTl?: number | null;

  @IsOptional()
  @IsString({ message: 'Invoice Transaction Number must be a string' })
  invoiceTransactionNo?: string;

  @IsOptional()
  @IsString({ message: 'Invoice Number must be a string' })
  invoiceNumber?: string;

  @IsOptional()
  @IsString({ message: 'QuickBook must be a string' })
  quickBook?: string;

  @IsOptional()
  @IsISO8601()
  containerDate?: string;

  @IsOptional()
  duePaid?: boolean;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  paidUsd1Date?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  paidUsd2Date?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  paidTl1Date?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  paidTl2Date?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  invoiceDate?: string | null;

  @IsOptional()
  @IsString()
  statusNote?: string;

  @IsOptional()
  @IsObject()
  priceNotes?: Record<string, string>;
}

export class UpdateDirectOrderItemDto {
  @IsOptional()
  @IsEnum(ProjectItemType)
  type?: ProjectItemType;

  @IsOptional()
  @IsString()
  customTypeId?: string;

  @IsOptional()
  @IsString()
  pfCode?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  orderTypeId?: string;

  @IsOptional()
  @IsString()
  orderType?: string;

  @IsOptional()
  @IsEnum(SignStatus, { message: 'PF Sign Status must be one of: NOT_SIGNED, READY_TO_SIGN, SIGNED' })
  pfSignStatus?: SignStatus;

  @IsOptional()
  @IsEnum(SignStatus, { message: 'PO Sign Status must be one of: NOT_SIGNED, READY_TO_SIGN, SIGNED' })
  poSignStatus?: SignStatus;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsISO8601()
  std?: string;

  @IsOptional()
  @IsISO8601()
  etd?: string;

  @IsOptional()
  @IsISO8601()
  rtd?: string;

  @IsOptional()
  @IsISO8601()
  ftd?: string;

  @IsOptional()
  @IsISO8601()
  rtr?: string;

  @IsOptional()
  @IsISO8601()
  rdy?: string;

  @IsOptional()
  @IsISO8601()
  snd?: string;

  @IsOptional()
  @IsString()
  containerNo?: string;

  @IsOptional()
  @IsString()
  paymentRule?: string;

  @IsOptional()
  @Transform(toNum)
  pfUsd?: number;

  @IsOptional()
  @Transform(toNum)
  pfTl?: number;

  @IsOptional()
  @Transform(toNum)
  paidUsd1?: number;

  @IsOptional()
  @Transform(toNum)
  paidUsd2?: number;

  @IsOptional()
  @Transform(toNum)
  paidTl1?: number;

  @IsOptional()
  @Transform(toNum)
  paidTl2?: number;

  @IsOptional()
  @Transform(toNumNullable)
  invoice?: number | null;

  @IsOptional()
  @Transform(toNumNullable)
  invoiceTl?: number | null;

  @IsOptional()
  @IsString({ message: 'Invoice Transaction Number must be a string' })
  invoiceTransactionNo?: string;

  @IsOptional()
  @IsString({ message: 'Invoice Number must be a string' })
  invoiceNumber?: string;

  @IsOptional()
  @IsString({ message: 'QuickBook must be a string' })
  quickBook?: string;

  @IsOptional()
  @IsISO8601()
  containerDate?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  paidUsd1Date?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  paidUsd2Date?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  paidTl1Date?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  paidTl2Date?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsISO8601()
  invoiceDate?: string | null;

  @IsOptional()
  @IsString()
  statusNote?: string;

  @IsOptional()
  @IsObject()
  priceNotes?: Record<string, string>;
}
