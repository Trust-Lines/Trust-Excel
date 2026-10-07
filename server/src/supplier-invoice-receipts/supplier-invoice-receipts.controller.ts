import { Controller, Get, Post, Put, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { SupplierInvoiceReceiptsService } from './supplier-invoice-receipts.service';
import { CreateInvoiceReceiptRowDto } from './dto/create-invoice-receipt-row.dto';
import { UpdateInvoiceReceiptRowDto } from './dto/update-invoice-receipt-row.dto';

@Controller('supplier-invoice-receipts')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('suppliers_vendors')
export class SupplierInvoiceReceiptsController {
  constructor(private readonly service: SupplierInvoiceReceiptsService) {}

  @Get()
  getByVendorCodeAndMode(
    @Query('vendorCode') vendorCode: string,
    @Query('mode') mode: string
  ) {
    return this.service.getByVendorCodeAndMode(vendorCode, mode);
  }

  @Put('item/:itemId')
  upsertByItemId(@Param('itemId') itemId: string, @Body() dto: CreateInvoiceReceiptRowDto, @Request() req: any) {
    return this.service.upsertByItemId(itemId, dto, req.user?.userId || req.user?.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceReceiptRowDto, @Request() req: any) {
    return this.service.update(id, dto, req.user?.userId || req.user?.id);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.service.delete(id, req.user?.userId || req.user?.id);
  }
}
