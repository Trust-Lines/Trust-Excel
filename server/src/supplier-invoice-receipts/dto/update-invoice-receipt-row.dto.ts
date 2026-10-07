import { IsString, IsOptional } from 'class-validator';

export class UpdateInvoiceReceiptRowDto {
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
