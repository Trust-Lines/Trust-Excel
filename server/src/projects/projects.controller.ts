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
  Request,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { ProjectsService, ProjectListQuery } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectItemDto } from './dto/create-project-item.dto';
import { UpdateProjectItemDto } from './dto/update-project-item.dto';
import { BulkAssignHalfDto } from './dto/bulk-assign-half.dto';
import {
  ProjectWithRelations,
  ProjectItemWithVendor,
  PaginatedProjectsResponse
} from './dto/project-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { ProjectStatus, ProjectBucket } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator';


@Controller('projects')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('operational_board')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() createProjectDto: CreateProjectDto, @Request() req: any): Promise<ProjectWithRelations> {
    return this.projectsService.createWithPermissionCheck(createProjectDto, req.user.userId);
  }

  @Get()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  findAll(@Query() query: ProjectListQuery, @Request() req: any): Promise<PaginatedProjectsResponse> {
    return this.projectsService.findAll(query, req.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any): Promise<ProjectWithRelations> {
    return this.projectsService.findOne(id, req.user);
  }

  /**
   * PATCH /projects/bulk/half - Assign a set of projects to a half-year (or clear it)
   */
  @Patch('bulk/half')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  bulkAssignHalf(
    @Body() bulkAssignHalfDto: BulkAssignHalfDto,
    @Request() req: any,
  ): Promise<{ updatedCount: number }> {
    return this.projectsService.bulkAssignHalf(bulkAssignHalfDto, req.user?.userId || req.user?.id);
  }

  @Patch(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  update(
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
    @Request() req: any,
  ): Promise<ProjectWithRelations> {
    return this.projectsService.update(id, updateProjectDto, req.user.id);
  }

  @Patch(':id/move-region')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  moveRegion(
    @Param('id') id: string,
    @Body() body: { bucket: ProjectBucket },
    @Request() req: any,
  ): Promise<ProjectWithRelations> {
    return this.projectsService.moveRegion(id, body.bucket, req.user?.userId || req.user?.id);
  }

  @Patch(':id/dropbox-setup')
  setupDropboxFolder(
    @Param('id') id: string,
    @Body() body: any,
  ): Promise<{ dropboxPath: string }> {
    return this.projectsService.setupDropboxFolder(id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    return this.projectsService.remove(id, req.user?.userId || req.user?.id);
  }

  // ================== PROJECT ITEM ENDPOINTS ==================

  /**
   * POST /projects/:projectId/items - Create a new project item
   */
  @Post(':projectId/items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createProjectItem(
    @Param('projectId') projectId: string,
    @Body() createItemDto: CreateProjectItemDto,
    @Request() req: any
  ): Promise<ProjectItemWithVendor> {
    return this.projectsService.createProjectItemWithPermissionCheck(projectId, createItemDto, req.user.userId);
  }

  /**
   * GET /projects/:projectId/items - Get all items for a project
   */
  @Get(':projectId/items')
  findProjectItems(@Param('projectId') projectId: string, @Request() req: any): Promise<ProjectItemWithVendor[]> {
    return this.projectsService.findProjectItems(projectId, req.user);
  }

  /**
   * GET /projects/:projectId/items/:itemId - Get a specific project item
   */
  @Get(':projectId/items/:itemId')
  findProjectItem(
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string
  ): Promise<ProjectItemWithVendor> {
    return this.projectsService.findProjectItem(projectId, itemId);
  }

  /**
   * PATCH /projects/items/:itemId - Update a project item
   * FIELD-LEVEL AUTHORIZATION: Users can edit only fields allowed by their role policy
   */
  @Patch('items/:itemId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  updateProjectItem(
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateProjectItemDto,
    @Request() req: any
  ): Promise<ProjectItemWithVendor> {

    return this.projectsService.updateProjectItemWithFieldAuthorization(itemId, updateItemDto, req.user.userId);
  }

  /**
   * DELETE /projects/:projectId/items/:itemId - Remove a project item
   */
  @Delete(':projectId/items/:itemId')
  removeProjectItem(
    @Param('projectId') projectId: string,
    @Param('itemId') itemId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    return this.projectsService.removeProjectItem(projectId, itemId, req.user?.userId || req.user?.id);
  }

}