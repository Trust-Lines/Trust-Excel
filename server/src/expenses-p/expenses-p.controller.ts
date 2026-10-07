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
import { ExpensesPService } from './expenses-p.service';
import { CreateExpensesPProjectDto } from './dto/create-expenses-p-project.dto';
import { CreateExpensesPItemDto } from './dto/create-expenses-p-item.dto';
import { UpdateExpensesPItemDto } from './dto/update-expenses-p-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';

@Controller('expenses-p')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('expenses_p')
export class ExpensesPController {
  constructor(private readonly expensesPService: ExpensesPService) {}

  // ==================== PROJECT ENDPOINTS ====================

  @Get('projects')
  findAllProjects(@Request() req: any) {
    return this.expensesPService.findAllProjects(req.user);
  }

  @Post('projects')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createProject(@Body() dto: CreateExpensesPProjectDto) {
    return this.expensesPService.createProject(dto);
  }

  @Patch('projects/:id')
  updateProject(@Param('id') id: string, @Body() dto: any) {
    return this.expensesPService.updateProject(id, dto);
  }

  @Patch('projects/:id/move-region')
  moveRegion(@Param('id') id: string, @Body() dto: { bucket: string }) {
    return this.expensesPService.moveRegion(id, dto.bucket);
  }

  @Delete('projects/:id')
  deleteProject(@Param('id') id: string) {
    return this.expensesPService.deleteProject(id);
  }

  // ==================== ITEM ENDPOINTS ====================

  @Post('projects/:projectId/items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  createItem(
    @Param('projectId') projectId: string,
    @Body() dto: CreateExpensesPItemDto,
  ) {
    return this.expensesPService.createItem(projectId, dto);
  }

  @Patch('items/:itemId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateExpensesPItemDto,
  ) {
    return this.expensesPService.updateItem(itemId, dto);
  }

  @Delete('items/:itemId')
  deleteItem(@Param('itemId') itemId: string) {
    return this.expensesPService.deleteItem(itemId);
  }
}
