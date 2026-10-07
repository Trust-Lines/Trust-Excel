import { IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateInvoiceReceiptRowDto {
  @IsString()
  itemId: string;

  @IsString()
  mode: string; // "PROJECT", "MISSING_EXTRA", "DIRECT_ORDER"

  @IsString()
  vendorCode: string;

  @IsString()
  region: string;

  @IsOptional()
  @IsString()
  transactionNo?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  quickBook?: string;
}
