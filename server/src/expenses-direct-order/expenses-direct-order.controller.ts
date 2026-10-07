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
import { ExpensesDirectOrderService } from './expenses-direct-order.service';
import { CreateExpensesDOProjectDto } from './dto/create-expenses-do-project.dto';
import { CreateExpensesDOItemDto } from './dto/create-expenses-do-item.dto';
import { UpdateExpensesDOItemDto } from './dto/update-expenses-do-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';

@Controller('expenses-direct-order')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('expenses_direct_order')
export class ExpensesDirectOrderController {
  constructor(private readonly expensesDirectOrderService: ExpensesDirectOrderService) {}

  // ==================== PROJECT ENDPOINTS ====================

  @Get('projects')
  findAllProjects(@Request() req: any) {
    return this.expensesDirectOrderService.findAllProjects(req.user);
  }

  @Post('projects')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createProject(@Body() dto: CreateExpensesDOProjectDto, @Request() req: any) {
    return this.expensesDirectOrderService.createProject(dto, req.user?.id);
  }

  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.expensesDirectOrderService.updateProject(id, dto, req.user?.id);
  }

  @Patch('projects/:id/move-region')
  moveRegion(@Param('id') id: string, @Body() dto: { bucket: string }, @Request() req: any) {
    return this.expensesDirectOrderService.moveRegion(id, dto.bucket, req.user?.id);
  }

  @Delete('projects/:id')
  deleteProject(@Param('id') id: string, @Request() req: any) {
    return this.expensesDirectOrderService.deleteProject(id, req.user?.id);
  }

  // ==================== ITEM ENDPOINTS ====================

  @Post('projects/:projectId/items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  createItem(
    @Param('projectId') projectId: string,
    @Body() dto: CreateExpensesDOItemDto,
    @Request() req: any,
  ) {
    return this.expensesDirectOrderService.createItem(projectId, dto, req.user?.id);
  }

  @Patch('items/:itemId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateExpensesDOItemDto,
    @Request() req: any,
  ) {
    return this.expensesDirectOrderService.updateItem(itemId, dto, req.user?.id);
  }

  @Delete('items/:itemId')
  deleteItem(@Param('itemId') itemId: string, @Request() req: any) {
    return this.expensesDirectOrderService.deleteItem(itemId, req.user?.id);
  }
}
