import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsObject } from 'class-validator';
import { ProjectItemType, ItemStatus } from '@prisma/client';
import { Transform } from 'class-transformer';

export class UpdateExpensesMEItemDto {
  @IsOptional()
  @IsEnum(ProjectItemType)
  type?: ProjectItemType;

  @IsOptional()
  @IsString()
  customTypeId?: string;

  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsString()
  orderType?: string;

  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @IsOptional()
  @IsDateString()
  std?: string;

  @IsOptional()
  @IsDateString()
  etd?: string;

  @IsOptional()
  @IsDateString()
  rtrd?: string;

  @IsOptional()
  @IsDateString()
  ftd?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  expensesUsd?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  expensesTl?: number;

  @IsOptional()
  @IsString()
  shelvesLoc?: string;

  @IsOptional()
  @IsString()
  containerNo?: string;

  @IsOptional()
  @IsString()
  invoiceSit?: string;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  paidUsd1?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  paidUsd2?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  paidTl1?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => value !== undefined && value !== '' ? parseFloat(value) : undefined)
  paidTl2?: number;

  @IsOptional()
  @IsString()
  invoiceTransactionNo?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  quickBook?: string;

  @IsOptional()
  @IsString()
  paymentRule?: string;

  @IsOptional()
  @IsString()
  statusNote?: string;

  @IsOptional()
  @IsObject()
  priceNotes?: Record<string, string>;
}
