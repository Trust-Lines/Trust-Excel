import { IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsNumber, IsISO8601, ValidateIf, IsObject } from 'class-validator';
import { ProjectItemType, SignStatus, ItemStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class CreateMissingExtraItemDto {
  @ValidateIf((obj) => !obj.customTypeId)
  @IsNotEmpty({ message: 'Either type or customTypeId must be provided' })
  @IsEnum(ProjectItemType, { message: 'Type must be one of: MILLWORK, SHELVING, CEILING, IMAGE, FURNITURE' })
  type?: ProjectItemType;

  @IsOptional()
  @ValidateIf((obj) => !obj.type)
  @IsNotEmpty({ message: 'Either type or customTypeId must be provided' })
  @IsString({ message: 'Custom type ID must be a string' })
  customTypeId?: string;

  @IsOptional()
  @IsString({ message: 'Vendor ID must be a string' })
  vendorId?: string;

  @IsOptional()
  @IsString({ message: 'Order type must be a string' })
  orderType?: string;

  @IsOptional()
  @IsEnum(SignStatus, { message: 'PF Sign Status must be one of: NOT_SIGNED, READY_TO_SIGN, SIGNED' })
  pfSignStatus?: SignStatus;

  @IsOptional()
  @IsEnum(SignStatus, { message: 'PO Sign Status must be one of: NOT_SIGNED, READY_TO_SIGN, SIGNED' })
  poSignStatus?: SignStatus;

  @IsOptional()
  @IsEnum(ItemStatus, { message: 'Status must be a valid item status' })
  status?: ItemStatus;

  @IsOptional()
  @IsDateString({}, { message: 'STD must be a valid date string' })
  std?: string;

  @IsOptional()
  @IsDateString({}, { message: 'ETD must be a valid date string' })
  etd?: string;

  @IsOptional()
  @IsDateString({}, { message: 'RTD must be a valid date string' })
  rtd?: string;

  @IsOptional()
  @IsDateString({}, { message: 'RTR must be a valid date string' })
  rtr?: string;

  @IsOptional()
  @IsDateString({}, { message: 'FTD must be a valid date string' })
  ftd?: string;

  @IsOptional()
  @IsDateString({}, { message: 'RDY must be a valid date string' })
  rdy?: string;

  @IsOptional()
  @IsDateString({}, { message: 'SND must be a valid date string' })
  snd?: string;

  @IsOptional()
  @IsNumber({}, { message: 'PF USD must be a valid number' })
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  pfUsd?: number;

  @IsOptional()
  @IsNumber({}, { message: 'PF TL must be a valid number' })
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  pfTl?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Paid USD 1 must be a valid number' })
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  paidUsd1?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Paid USD 2 must be a valid number' })
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  paidUsd2?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Paid TL 1 must be a valid number' })
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  paidTl1?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Paid TL 2 must be a valid number' })
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  paidTl2?: number;

  @IsOptional()
  @Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseFloat(value) : (value === null ? null : undefined))
  invoice?: number | null;

  @IsOptional()
  @Transform(({ value }) => value !== undefined && value !== null && value !== '' ? parseFloat(value) : (value === null ? null : undefined))
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
  @IsString({ message: 'Container number must be a string' })
  containerNo?: string;

  @IsOptional()
  @IsISO8601()
  containerDate?: string;

  @IsOptional()
  @IsString({ message: 'Payment rule must be a string' })
  paymentRule?: string;

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