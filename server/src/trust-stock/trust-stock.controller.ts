import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, Res, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { TrustStockService } from './trust-stock.service';
import { CreateTrustStockGroupDto, UpdateTrustStockGroupDto, TrustStockItemDto } from './dto/trust-stock.dto';
import { UpdateStockProductDto, CreateStockUsageDto, StockMovementsDto, ReorderPfDto } from './dto/trust-stock-pdf.dto';
import { TrustStockColumnRules, redactStockItem, redactProductPrices, blockedStockItemFields, hidesProductPrices } from './trust-stock-columns';

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

  // Role column rules (Admin > Roles > Trust Stock columns): hidden prices are left out of
  // every response, hidden / read-only columns can't be written, PDFs need the PF PDF column.
  private rules(req: any) {
    return this.service.columnRules(req.user);
  }
  private static group<G extends { items?: any[] }>(g: G, r: TrustStockColumnRules): G {
    return g?.items ? { ...g, items: g.items.map(i => redactStockItem(i, r)) } : g;
  }
  private static checkWrite(dto: Record<string, any>, r: TrustStockColumnRules) {
    const blocked = blockedStockItemFields(dto, r);
    if (blocked.length) throw new ForbiddenException(`Your role can't change: ${blocked.join(', ')}`);
  }
  private static requirePdfAccess(r: TrustStockColumnRules) {
    if (r.hidden.has('pfPdf')) throw new ForbiddenException('Your role has no access to the PF PDFs');
  }

  // ── Groups (STOCK 1, STOCK 2, …) ──
  @Get('groups')
  async findAll(@Request() req: any) {
    const r = await this.rules(req);
    const { data } = await this.service.findAllGroups();
    return { data: data.map(g => TrustStockController.group(g, r)) };
  }

  @Post('groups')
  async createGroup(@Body() dto: CreateTrustStockGroupDto, @Request() req: any) {
    return TrustStockController.group(await this.service.createGroup(dto, req.user?.id), await this.rules(req));
  }

  @Patch('groups/:id')
  async updateGroup(@Param('id') id: string, @Body() dto: UpdateTrustStockGroupDto, @Request() req: any) {
    return TrustStockController.group(await this.service.updateGroup(id, dto, req.user?.id), await this.rules(req));
  }

  @Delete('groups/:id')
  deleteGroup(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteGroup(id, req.user?.id);
  }

  // ── Items ──
  @Post('groups/:groupId/items')
  async createItem(@Param('groupId') groupId: string, @Body() dto: TrustStockItemDto, @Request() req: any) {
    const r = await this.rules(req);
    TrustStockController.checkWrite(dto, r);
    return redactStockItem(await this.service.createItem(groupId, dto, req.user?.id), r);
  }

  @Patch('items/:itemId')
  async updateItem(@Param('itemId') itemId: string, @Body() dto: TrustStockItemDto, @Request() req: any) {
    const r = await this.rules(req);
    TrustStockController.checkWrite(dto, r);
    return redactStockItem(await this.service.updateItem(itemId, dto, req.user?.id), r);
  }

  @Delete('items/:itemId')
  deleteItem(@Param('itemId') itemId: string, @Request() req: any) {
    return this.service.deleteItem(itemId, req.user?.id);
  }

  // ── PF PDF import ──
  @Post('pdf/preview')
  @UseInterceptors(PDF_UPLOAD)
  async previewPdf(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    TrustStockController.requirePdfAccess(await this.rules(req));
    return this.service.previewPdf(requirePdf(file).buffer);
  }

  /** multipart: file = the PDF, data = JSON of the (corrected) preview */
  @Post('pdf/import')
  @UseInterceptors(PDF_UPLOAD)
  async importPdf(@UploadedFile() file: Express.Multer.File, @Body('data') data: string, @Request() req: any) {
    const r = await this.rules(req);
    TrustStockController.requirePdfAccess(r);
    let parsed: unknown;
    try { parsed = JSON.parse(data || ''); } catch { throw new BadRequestException('Invalid import data'); }
    const pdf = requirePdf(file);
    return redactStockItem(await this.service.importPdf(pdf.buffer, pdf.originalname, parsed, req.user?.id) as any, r);
  }

  @Get('items/:itemId/pdf')
  async getPdf(@Param('itemId') itemId: string, @Request() req: any, @Res() res: Response) {
    TrustStockController.requirePdfAccess(await this.rules(req));
    const { data, fileName } = await this.service.getPdf(itemId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.send(data);
  }

  // ── Stock contents ──
  @Get('products')
  async listProducts(@Request() req: any) {
    return redactProductPrices(await this.service.listProducts(), await this.rules(req));
  }

  /** Product catalog (every item code entered so far) for the manual-entry dropdown */
  @Get('catalog')
  async catalog(@Request() req: any) {
    return redactProductPrices(await this.service.listCatalog(), await this.rules(req));
  }

  /** Re-order PF (PDF) for the products and quantities picked in the RE-ORDER tab */
  @Post('reorder-pf')
  async reorderPf(@Body() dto: ReorderPfDto, @Request() req: any, @Res() res: Response) {
    TrustStockController.requirePdfAccess(await this.rules(req));
    const { data, fileName } = await this.service.reorderPf(dto.lines, { addToStock: dto.addToStock });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.send(data);
  }

  @Patch('products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateStockProductDto, @Request() req: any) {
    const r = await this.rules(req);
    if (hidesProductPrices(r) && (dto.unitPrice !== undefined || dto.totalPrice !== undefined)) {
      throw new ForbiddenException("Your role can't change prices");
    }
    return redactProductPrices([await this.service.updateProduct(id, dto, req.user?.id) as any], r)[0];
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string, @Request() req: any) {
    return this.service.deleteProduct(id, req.user?.id);
  }

  // ── Usage from the Projects table (Projects page access, not Trust Stock) ──
  @Get('usage/products')
  @RequirePageAccess('operational_board')
  async availableProducts(@Request() req: any) {
    return redactProductPrices(await this.service.listProducts(), await this.rules(req));
  }

  @Get('usage')
  @RequirePageAccess('operational_board')
  async usageForRow(@Query('projectItemId') projectItemId: string, @Request() req: any) {
    if (!projectItemId) throw new BadRequestException('projectItemId is required');
    return redactProductPrices(await this.service.usageForProjectItem(projectItemId) as any[], await this.rules(req));
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
