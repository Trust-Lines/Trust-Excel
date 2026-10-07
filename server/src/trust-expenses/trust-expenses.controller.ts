import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { TrustExpensesService } from './trust-expenses.service';
import { CreateTrustExpenseProjectDto } from './dto/create-trust-expense-project.dto';
import { CreateTrustExpenseItemDto, UpdateTrustExpenseItemDto, ReorderTrustExpenseItemsDto } from './dto/update-trust-expense-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';

@Controller('trust-expenses')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('trust_expenses')
export class TrustExpensesController {
  constructor(private readonly trustExpensesService: TrustExpensesService) {}

  // ==================== PROJECT ENDPOINTS ====================

  @Get('projects')
  findAllProjects(@Request() req: any) {
    return this.trustExpensesService.findAllProjects(req.user);
  }

  @Post('projects')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createProject(@Body() dto: CreateTrustExpenseProjectDto) {
    return this.trustExpensesService.createProject(dto);
  }

  @Get('projects/:id')
  findOneProject(@Param('id') id: string) {
    return this.trustExpensesService.findOneProject(id);
  }

  // ==================== FLAT ITEM ENDPOINTS ====================

  @Get('items')
  findAllItems(@Request() req: any) {
    return this.trustExpensesService.findAllItems(req.user);
  }

  @Post('items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createItemDirect(@Body() dto: CreateTrustExpenseItemDto) {
    return this.trustExpensesService.createItemDirect(dto);
  }

  // MUST be declared BEFORE PATCH items/:itemId to avoid route collision
  @Patch('items/reorder')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  reorderItems(@Body() dto: ReorderTrustExpenseItemsDto) {
    return this.trustExpensesService.reorderItems(dto);
  }

  // ==================== ITEM ENDPOINTS ====================

  @Post('projects/:projectId/items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createItem(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTrustExpenseItemDto,
  ) {
    return this.trustExpensesService.createItem(projectId, dto);
  }

  @Patch('items/:itemId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateTrustExpenseItemDto,
  ) {
    return this.trustExpensesService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  deleteItem(@Param('itemId') itemId: string) {
    return this.trustExpensesService.deleteItem(itemId);
  }
}
