import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { ContainersService } from './containers.service';
import {
  GlobalContainerDateDto,
  SyncContainerDateDto,
  SyncContainerDateResponseDto
} from './dto/global-container-date.dto';

@Controller('containers')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('operational_board')
export class ContainersController {
  constructor(private readonly containersService: ContainersService) {}

  /**
   * 🔍 GET /api/containers/latest-date?containerNo=CONTAINER%201
   * Find latest container date across all projects for a specific container number
   */
  @Get('latest-date')
  async getLatestContainerDate(
    @Query('containerNo') containerNo: string
  ): Promise<{ containerNo: string; latestDate: string | null }> {
    const latestDate = await this.containersService.findLatestContainerDate(containerNo);

    return {
      containerNo,
      latestDate
    };
  }

  /**
   * 📊 GET /api/containers/search?containerNo=CONTAINER
   * Search for containers across all projects (optional filter by containerNo)
   */
  @Get('search')
  async searchContainers(
    @Query('containerNo') containerNo?: string
  ): Promise<GlobalContainerDateDto[]> {
    return await this.containersService.searchContainers(containerNo);
  }

  /**
   * 🔄 POST /api/containers/sync
   * Synchronize container date across all projects for a specific container number
   */
  @Post('sync')
  @HttpCode(HttpStatus.OK)
  async syncContainerDate(
    @Body() syncDto: SyncContainerDateDto
  ): Promise<SyncContainerDateResponseDto> {
    const result = await this.containersService.syncContainerDate(
      syncDto.containerNo,
      syncDto.containerDate
    );

    return result;
  }

  /**
   * 📈 GET /api/containers/stats
   * Get statistics about container dates across all projects
   */
  @Get('stats')
  async getContainerStats(): Promise<{
    totalContainers: number;
    containersWithDates: number;
    uniqueContainerNumbers: number;
    projectTypes: {
      project: number;
      directOrder: number;
      missingExtra: number;
    }
  }> {
    const allContainers = await this.containersService.searchContainers();
    const containersWithDates = allContainers.filter(c => c.containerDate !== null);

    const uniqueContainerNumbers = new Set(
      allContainers.map(c => c.containerNo.toUpperCase())
    ).size;

    const projectTypeCounts = allContainers.reduce(
      (acc, container) => {
        acc[container.projectType]++;
        return acc;
      },
      { project: 0, directOrder: 0, missingExtra: 0 }
    );

    return {
      totalContainers: allContainers.length,
      containersWithDates: containersWithDates.length,
      uniqueContainerNumbers,
      projectTypes: projectTypeCounts
    };
  }

  /**
   * 📋 GET /api/containers/master
   * List all containers from the master table
   */
  @Get('master')
  async listContainers(): Promise<{ id: string; name: string }[]> {
    return this.containersService.listContainers();
  }

  /**
   * ➕ POST /api/containers/master
   * Create a new container in the master table
   */
  @Post('master')
  @HttpCode(HttpStatus.CREATED)
  async createContainer(
    @Body() body: { name: string },
  ): Promise<{ id: string; name: string }> {
    return this.containersService.createContainer(body.name);
  }

  /**
   * ✏️ PATCH /api/containers/master/:id/rename
   * Rename a container - all items referencing it reflect the change automatically
   */
  @Patch('master/:id/rename')
  async renameContainer(
    @Param('id') id: string,
    @Body() body: { name: string },
  ): Promise<{ id: string; name: string; updatedItems: number }> {
    return this.containersService.renameContainer(id, body.name);
  }

  /**
   * ✏️ POST /api/containers/rename
   * Rename container globally by containerNo string across ALL item tables
   */
  @Post('rename')
  @HttpCode(HttpStatus.OK)
  async renameContainerByName(
    @Body() body: { oldName: string; newName: string },
  ): Promise<{ oldName: string; newName: string; updatedItems: number }> {
    return this.containersService.renameContainerByName(body.oldName, body.newName);
  }

  /**
   * 📋 GET /api/containers/names
   * Get all unique container names currently in use
   */
  @Get('names')
  async getUniqueContainerNames(): Promise<string[]> {
    return this.containersService.getUniqueContainerNames();
  }
}