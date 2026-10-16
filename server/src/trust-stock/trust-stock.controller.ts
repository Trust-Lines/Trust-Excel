import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { TrustStockService } from './trust-stock.service';
import { CreateTrustStockGroupDto, UpdateTrustStockGroupDto, TrustStockItemDto } from './dto/trust-stock.dto';

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
}
