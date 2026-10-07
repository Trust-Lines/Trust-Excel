import { Controller, Get, Post, Delete, Body, Param, UseGuards, Request, ValidationPipe, UsePipes } from '@nestjs/common';
import { TodayPfService } from './today-pf.service';
import { CreateTodayPfFlagDto } from './dto/create-today-pf-flag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';

@Controller('today-pf')
@UseGuards(JwtAuthGuard)
export class TodayPfController {
  constructor(private readonly todayPfService: TodayPfService) {}

  // Any authenticated user can read the active flags — this is what drives
  // the "Today's PFs" filter chip everyone sees.
  @Get()
  list() {
    return this.todayPfService.list();
  }

  @Post()
  @UseGuards(PageAccessGuard)
  @RequirePageAccess('todays_pf_manage')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(@Body() dto: CreateTodayPfFlagDto, @Request() req: any) {
    return this.todayPfService.create(dto, req.user?.userId || req.user?.id);
  }

  @Delete(':id')
  @UseGuards(PageAccessGuard)
  @RequirePageAccess('todays_pf_manage')
  remove(@Param('id') id: string) {
    return this.todayPfService.remove(id);
  }
}
