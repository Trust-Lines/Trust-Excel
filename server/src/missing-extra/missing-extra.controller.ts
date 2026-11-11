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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectBucket } from '@prisma/client';
import { MissingExtraService } from './missing-extra.service';
import { CreateMissingExtraCaseDto } from './dto/create-case.dto';
import { UpdateMissingExtraCaseDto } from './dto/update-case.dto';
import { CreateMissingExtraItemDto } from './dto/create-item.dto';
import { UpdateMissingExtraItemDto } from './dto/update-item.dto';
import { BulkAssignHalfDto } from './dto/bulk-assign-half.dto';
import {
  MissingExtraCaseResponse,
  MissingExtraItemResponse,
  GroupedMissingExtraCasesResponse
} from './dto/response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';

@Controller('missing-extra')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('missing_extra')
export class MissingExtraController {
  constructor(private readonly missingExtraService: MissingExtraService) {}

  @Post('cases')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async createCase(@Body() createCaseDto: CreateMissingExtraCaseDto, @Request() req: any): Promise<MissingExtraCaseResponse> {
    try {
      const newCase = await this.missingExtraService.createCase(createCaseDto, req.user?.userId || req.user?.id);

      // Ensure we return the complete response with all required fields
      return {
        id: newCase.id,
        baseProjectId: newCase.baseProjectId,
        baseProjectNo: newCase.baseProjectNo,
        baseProjectName: newCase.baseProjectName,
        section: newCase.section,
        caseType: newCase.caseType,
        caseIndex: newCase.caseIndex,
        derivedProjectCode: newCase.derivedProjectCode,
        types: newCase.types,
        createdAt: newCase.createdAt,
        updatedAt: newCase.updatedAt,
        baseProject: newCase.baseProject,
        items: newCase.items
      };
    } catch (error) {
      console.error('❌ CREATE_CASE ERROR', {
        error: error.message,
        stack: error.stack,
        payload: createCaseDto
      });
      throw error;
    }
  }

  @Get('cases')
  async findAllCases(@Request() req: any): Promise<GroupedMissingExtraCasesResponse> {
    try {
      const result = await this.missingExtraService.findAllCases(req.user);
      return result;
    } catch (error) {
      console.error('❌ [MISSING_EXTRA_CONTROLLER] GET /cases failed:', {
        error: error.message,
        stack: error.stack,
        user: req.user?.email
      });
      throw error;
    }
  }

  @Get('cases/:id')
  findCaseById(@Param('id') id: string, @Request() req: any): Promise<MissingExtraCaseResponse> {
    return this.missingExtraService.findCaseById(id);
  }

  /**
   * PATCH /missing-extra/cases/bulk/half - Assign a set of cases to a half-year (or clear it)
   */
  @Patch('cases/bulk/half')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  bulkAssignHalf(
    @Body() bulkAssignHalfDto: BulkAssignHalfDto,
    @Request() req: any,
  ): Promise<{ updatedCount: number }> {
    return this.missingExtraService.bulkAssignHalf(bulkAssignHalfDto, req.user?.userId || req.user?.id);
  }

  /** Region change from the project menu (the case keeps its region in `section`) */
  @Patch('cases/:id/move-region')
  moveRegion(
    @Param('id') id: string,
    @Body('bucket') bucket: ProjectBucket,
    @Request() req: any,
  ): Promise<MissingExtraCaseResponse> {
    if (!Object.values(ProjectBucket).includes(bucket)) throw new BadRequestException('Invalid region');
    return this.missingExtraService.updateCase(id, { section: bucket }, req.user?.userId || req.user?.id);
  }

  @Patch('cases/:id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  updateCase(
    @Param('id') id: string,
    @Body() updateCaseDto: UpdateMissingExtraCaseDto,
    @Request() req: any,
  ): Promise<MissingExtraCaseResponse> {
    return this.missingExtraService.updateCase(id, updateCaseDto, req.user?.userId || req.user?.id);
  }

  @Delete('cases/:id')
  deleteCase(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    return this.missingExtraService.deleteCase(id, req.user?.userId || req.user?.id);
  }

  // ================== ITEM ENDPOINTS ==================

  /**
   * POST /missing-extra/cases/:caseId/items - Create a new item for a case
   */
  @Post('cases/:caseId/items')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  createItem(
    @Param('caseId') caseId: string,
    @Body() createItemDto: CreateMissingExtraItemDto,
    @Request() req: any
  ): Promise<MissingExtraItemResponse> {
    return this.missingExtraService.createItem(caseId, createItemDto, req.user?.userId || req.user?.id);
  }

  /**
   * GET /missing-extra/cases/:caseId/items - Get all items for a case
   */
  @Get('cases/:caseId/items')
  findItemsByCase(@Param('caseId') caseId: string, @Request() req: any): Promise<MissingExtraItemResponse[]> {
    return this.missingExtraService.findItemsByCase(caseId, req.user);
  }

  /**
   * PATCH /missing-extra/items/:itemId - Update an item
   * FIELD-LEVEL AUTHORIZATION: Same as projects - users can edit only fields allowed by their role policy
   */
  @Patch('items/:itemId')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: false }))
  updateItem(
    @Param('itemId') itemId: string,
    @Body() updateItemDto: UpdateMissingExtraItemDto,
    @Request() req: any
  ): Promise<MissingExtraItemResponse> {
    // Use field-level authorization - same pattern as ProjectsService
    return this.missingExtraService.updateItemWithFieldAuthorization(
      itemId,
      updateItemDto,
      req.user.userId
    );
  }

  /**
   * DELETE /missing-extra/items/:itemId - Remove an item
   */
  @Delete('items/:itemId')
  deleteItem(@Param('itemId') itemId: string, @Request() req: any): Promise<{ message: string }> {
    return this.missingExtraService.deleteItem(itemId, req.user?.userId || req.user?.id);
  }

  /**
   * Test-only endpoints below wipe EVERY Missing & Extra case and item for good (no trash).
   * Page access alone used to be enough to call them; they now refuse unless the server runs
   * with ALLOW_DEV_ENDPOINTS=true, which the live server never has.
   */
  private static requireDevEndpoints() {
    if (process.env.ALLOW_DEV_ENDPOINTS !== 'true') {
      throw new ForbiddenException('Test endpoint disabled');
    }
  }

  /**
   * DELETE /missing-extra/dev/clear - Clear all cases and items (test databases only)
   */
  @Delete('dev/clear')
  async clearAllCases(@Request() req: any): Promise<{ message: string; deleted: { cases: number; items: number } }> {
    MissingExtraController.requireDevEndpoints();

    // Count before deletion
    const itemCount = await this.missingExtraService.countAllItems();
    const caseCount = await this.missingExtraService.countAllCases();

    // Delete all items first (foreign key constraint)
    await this.missingExtraService.deleteAllItems();
    // Then delete all cases
    await this.missingExtraService.deleteAllCases();


    return {
      message: 'All Missing & Extra cases and items cleared successfully',
      deleted: {
        cases: caseCount,
        items: itemCount
      }
    };
  }

  /**
   * POST /missing-extra/dev/reset - Reset and seed with test data (test databases only)
   */
  @Post('dev/reset')
  async resetWithSeedData(@Request() req: any): Promise<{ message: string; deleted: { cases: number; items: number }; seeded: { casesCount: number; itemsCount: number } }> {
    MissingExtraController.requireDevEndpoints();

    // First clear all existing data
    const itemCount = await this.missingExtraService.countAllItems();
    const caseCount = await this.missingExtraService.countAllCases();
    await this.missingExtraService.deleteAllItems();
    await this.missingExtraService.deleteAllCases();

    // Then seed predictable test data
    const seededData = await this.missingExtraService.seedTestData();


    return {
      message: 'Missing & Extra data reset and seeded successfully',
      deleted: { cases: caseCount, items: itemCount },
      seeded: seededData
    };
  }
}