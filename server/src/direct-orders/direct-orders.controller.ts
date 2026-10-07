import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DirectOrdersService } from './direct-orders.service';
import { CreateDirectOrderProjectDto, UpdateDirectOrderProjectDto } from './dto/create-direct-order-project.dto';
import { CreateDirectOrderItemDto, UpdateDirectOrderItemDto } from './dto/create-direct-order-item.dto';
import { BulkAssignHalfDto } from './dto/bulk-assign-half.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { ProjectBucket } from '@prisma/client';

@Controller('direct-orders')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('direct_order')
export class DirectOrdersController {
  constructor(private readonly directOrdersService: DirectOrdersService) {}

  // ===================== PROJECT ENDPOINTS =====================

  @Post()
  async createProject(
    @Body() createDirectOrderProjectDto: CreateDirectOrderProjectDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.directOrdersService.createProject(createDirectOrderProjectDto, userId);
  }

  @Get()
  async findAllProjects(@Req() req: any, @Query('bucket') bucket?: ProjectBucket) {
    const user = req.user;
    const projects = await this.directOrdersService.findAllProjects(bucket, user);

    // Transform to match frontend expectations (same format as Projects API)
    const transformedProjects = projects.map(project => ({
      ...project,
      // Ensure compatibility with existing frontend interfaces
      items: project.items.map(item => ({
        ...item,
        vendor: item.vendor ? { id: item.vendor.id, code: item.vendor.code, name: item.vendor.name } : null,
        customType: item.customType,
        orderType: item.orderType || item.orderTypeRef?.name,
      }))
    }));

    const sections = this.groupProjectsBySection(transformedProjects);

    const response = {
      data: transformedProjects,
      sections: sections,
    };

    return response;
  }

  @Get(':id')
  async findProjectById(@Param('id') id: string) {
    return this.directOrdersService.findProjectById(id);
  }

  /**
   * PATCH /direct-orders/bulk/half - Assign a set of direct order projects to a half-year (or clear it)
   */
  @Patch('bulk/half')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async bulkAssignHalf(@Body() bulkAssignHalfDto: BulkAssignHalfDto, @Req() req: any) {
    const userId = req.user?.id;
    return this.directOrdersService.bulkAssignHalf(bulkAssignHalfDto, userId);
  }

  @Patch(':id')
  async updateProject(
    @Param('id') id: string,
    @Body() updateDirectOrderProjectDto: UpdateDirectOrderProjectDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.directOrdersService.updateProject(id, updateDirectOrderProjectDto, userId);
  }

  @Delete(':id')
  async deleteProject(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id;
    return this.directOrdersService.deleteProject(id, userId);
  }

  // ===================== ITEM ENDPOINTS =====================

  @Post(':projectId/items')
  async createItem(
    @Param('projectId') projectId: string,
    @Body() createDirectOrderItemDto: CreateDirectOrderItemDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.directOrdersService.createItem(projectId, createDirectOrderItemDto, userId);
  }

  @Patch(':projectId/items/:itemId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  async updateItem(
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
    @Body() updateDirectOrderItemDto: UpdateDirectOrderItemDto,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.directOrdersService.updateItemWithFieldAuthorization(projectId, itemId, updateDirectOrderItemDto, userId);
  }

  @Delete(':projectId/items/:itemId')
  async deleteItem(
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id;
    return this.directOrdersService.deleteItem(projectId, itemId, userId);
  }

  // ===================== UTILITY ENDPOINTS =====================

  @Post('fix-missing-pf-codes')
  async fixMissingPfCodes() {
    const result = await this.directOrdersService.fixMissingPfCodes();
    return {
      message: `Fixed ${result.fixed} Direct Order items`,
      details: result
    };
  }

  // ===================== PRIVATE HELPER METHODS =====================

  private groupProjectsBySection(projects: any[]) {
    // CRITICAL FIX: Use actual ProjectBucket enum values from database
    // Database has: TLINES_NE, TLINES_SE, TLINES_NW, CVW, TLINES_HQ, TLINES_TC
    const sections = [
      { bucket: 'TLINES_NE', section: 'TLINES_NE' },
      { bucket: 'TLINES_SE', section: 'TLINES_SE' },
      { bucket: 'TLINES_NW', section: 'TLINES_NW' },
      { bucket: 'CVW', section: 'TLines CVW' },
      { bucket: 'TLINES_HQ', section: 'TLINES_HQ' },
      { bucket: 'TLINES_TC', section: 'TLINES_TC' },
    ];

    return sections.map(({ bucket, section }) => ({
      section,
      projects: projects.filter(p => p.bucket === bucket),
    }));
  }
}