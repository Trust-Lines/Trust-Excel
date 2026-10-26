import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, Res, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { TrustStockService } from './trust-stock.service';
import { CreateTrustStockGroupDto, UpdateTrustStockGroupDto, TrustStockItemDto } from './dto/trust-stock.dto';
import { UpdateStockProductDto, CreateStockUsageDto, StockMovementsDto } from './dto/trust-stock-pdf.dto';

// Vercel caps request bodies at 4.5 MB
const PDF_UPLOAD = FileInterceptor('file', { limits: { fileSize: 4 * 1024 * 1024 } });
const requirePdf = (file?: Express.Multer.File) => {
  if (!file) throw new BadRequestException('No PDF uploaded');
  if (!/pdf/i.test(file.mimetype) && !/\.pdf$/i.test(file.originalname)) throw new BadRequestException('Only PDF files are accepted');
  return file;
};

@Controller('trust-stock')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('trust_stock')
export class TrustStockController {
  constructor(private readonly service: TrustStockService) {}

  // ── Groups (STOCK 1, STOCK 2, …) ──
  @Get('groups')
  findAll() {
    return this.service.findAllGroups();
  }

  @Post('groups')
  createGroup(@Body() dto: CreateTrustStockGroupDto, @Request() req: any) {
    return this.service.createGroup(dto, req.user?.id);
  }

  @Patch('groups/:id')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateTrustStockGroupDto, @Request() req: any) {
    return this.service.updateGroup(id, dto, req.user?.id);
  }

  @Delete('groups/:id')
  deleteGroup(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteGroup(id, req.user?.id);
  }

  // ── Items ──
  @Post('groups/:groupId/items')
  createItem(@Param('groupId') groupId: string, @Body() dto: TrustStockItemDto, @Request() req: any) {
    return this.service.createItem(groupId, dto, req.user?.id);
  }

  @Patch('items/:itemId')
  updateItem(@Param('itemId') itemId: string, @Body() dto: TrustStockItemDto, @Request() req: any) {
    return this.service.updateItem(itemId, dto, req.user?.id);
  }

  @Delete('items/:itemId')
  deleteItem(@Param('itemId') itemId: string, @Request() req: any) {
    return this.service.deleteItem(itemId, req.user?.id);
  }

  // ── PF PDF import ──
  @Post('pdf/preview')
  @UseInterceptors(PDF_UPLOAD)
  previewPdf(@UploadedFile() file: Express.Multer.File) {
    return this.service.previewPdf(requirePdf(file).buffer);
  }

  /** multipart: file = the PDF, data = JSON of the (corrected) preview */
  @Post('pdf/import')
  @UseInterceptors(PDF_UPLOAD)
  importPdf(@UploadedFile() file: Express.Multer.File, @Body('data') data: string, @Request() req: any) {
    let parsed: unknown;
    try { parsed = JSON.parse(data || ''); } catch { throw new BadRequestException('Invalid import data'); }
    const pdf = requirePdf(file);
    return this.service.importPdf(pdf.buffer, pdf.originalname, parsed, req.user?.id);
  }

  @Get('items/:itemId/pdf')
  async getPdf(@Param('itemId') itemId: string, @Res() res: Response) {
    const { data, fileName } = await this.service.getPdf(itemId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.send(data);
  }

  // ── Stock contents ──
  @Get('products')
  listProducts() {
    return this.service.listProducts();
  }

  /** Product catalog (every item code entered so far) for the manual-entry dropdown */
  @Get('catalog')
  catalog() {
    return this.service.listCatalog();
  }

  /** Re-order PF (PDF) for the products whose Order column is > 0; body.productIds narrows it */
  @Post('reorder-pf')
  async reorderPf(@Body('productIds') productIds: string[] | undefined, @Res() res: Response) {
    const { data, fileName } = await this.service.reorderPf(Array.isArray(productIds) ? productIds : undefined);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(data);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateStockProductDto, @Request() req: any) {
    return this.service.updateProduct(id, dto, req.user?.id);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteProduct(id, req.user?.id);
  }

  // ── Usage from the Projects table (Projects page access, not Trust Stock) ──
  @Get('usage/products')
  @RequirePageAccess('operational_board')
  availableProducts() {
    return this.service.listProducts();
  }

  @Get('usage')
  @RequirePageAccess('operational_board')
  usageForRow(@Query('projectItemId') projectItemId: string) {
    if (!projectItemId) throw new BadRequestException('projectItemId is required');
    return this.service.usageForProjectItem(projectItemId);
  }

  @Post('usage')
  @RequirePageAccess('operational_board')
  addUsage(@Body() dto: CreateStockUsageDto, @Request() req: any) {
    return this.service.addUsage(dto, req.user?.id);
  }

  /** Names used before as "taken by" */
  @Get('usage/people')
  @RequirePageAccess('operational_board')
  people() {
    return this.service.listPeople();
  }

  /** Take / reserve / return several products for one row in one go */
  @Post('usage/movements')
  @RequirePageAccess('operational_board')
  applyMovements(@Body() dto: StockMovementsDto, @Request() req: any) {
    return this.service.applyMovements(dto, req.user?.id);
  }

  @Delete('usage/:id')
  @RequirePageAccess('operational_board')
  removeUsage(@Param('id') id: string, @Request() req: any) {
    return this.service.removeUsage(id, req.user?.id);
  }
}
