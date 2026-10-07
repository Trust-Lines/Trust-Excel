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
import { ExpensesMissingExtraService } from './expenses-missing-extra.service';
import { CreateExpensesMEProjectDto } from './dto/create-expenses-me-project.dto';
import { CreateExpensesMEItemDto } from './dto/create-expenses-me-item.dto';
import { UpdateExpensesMEItemDto } from './dto/update-expenses-me-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';

@Controller('expenses-missing-extra')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('expenses_missing_extra')
export class ExpensesMissingExtraController {
  constructor(private readonly expensesMissingExtraService: ExpensesMissingExtraService) {}

  // ==================== PROJECT ENDPOINTS ====================

  @Get('projects')
  findAllProjects(@Request() req: any) {
    return this.expensesMissingExtraService.findAllProjects(req.user);
  }

  @Post('projects')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createProject(@Body() dto: CreateExpensesMEProjectDto, @Request() req: any) {
    return this.expensesMissingExtraService.createProject(dto, req.user?.id);
  }

  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Body() dto: any, @Request() req: any) {
    return this.expensesMissingExtraService.updateProject(id, dto, req.user?.id);
  }

  @Patch('projects/:id/move-region')
  moveRegion(@Param('id') id: string, @Body() dto: { bucket: string }, @Request() req: any) {
    return this.expensesMissingExtraService.moveRegion(id, dto.bucket, req.user?.id);
  }

  @Delete('projects/:id')
  deleteProject(@Param('id') id: string, @Request() req: any) {
    return this.expensesMissingExtraService.deleteProject(id, req.user?.id);
  }

  // ==================== ITEM ENDPOINTS ====================

  @Post('projects/:projectId/items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  createItem(
    @Param('projectId') projectId: string,
    @Body() dto: CreateExpensesMEItemDto,
    @Request() req: any,
  ) {
    return this.expensesMissingExtraService.createItem(projectId, dto, req.user?.id);
  }

  @Patch('items/:itemId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateExpensesMEItemDto,
    @Request() req: any,
  ) {
    return this.expensesMissingExtraService.updateItem(itemId, dto, req.user?.id);
  }

  @Delete('items/:itemId')
  deleteItem(@Param('itemId') itemId: string, @Request() req: any) {
    return this.expensesMissingExtraService.deleteItem(itemId, req.user?.id);
  }
}
