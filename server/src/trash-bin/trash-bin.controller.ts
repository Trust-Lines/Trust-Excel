import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Request,
  UseGuards,
  ParseBoolPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TrashBinService, TrashQueryDto } from './trash-bin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trash-bin')
@UseGuards(JwtAuthGuard)
export class TrashBinController {
  constructor(private readonly trashBinService: TrashBinService) {}

  @Get()
  findAll(
    @Query('moduleGroup') moduleGroup?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.trashBinService.findAll({
      moduleGroup,
      page: Number(page) || 1,
      limit: Number(limit) || 100,
    });
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  restore(@Param('id') id: string, @Request() req: any) {
    return this.trashBinService.restore(id, req.user?.id);
  }

  @Delete(':id/permanent')
  permanentDelete(
    @Param('id') id: string,
    @Query('force', new DefaultValuePipe(false), ParseBoolPipe) force: boolean,
    @Request() req: any,
  ) {
    return this.trashBinService.permanentDelete(id, req.user?.id, force);
  }
}
