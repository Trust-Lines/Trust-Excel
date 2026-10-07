import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { ProjectTotalsService } from './project-totals.service';

@Controller('project-totals')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('suppliers_vendors')
export class ProjectTotalsController {
  constructor(private readonly service: ProjectTotalsService) {}

  @Get()
  getProjectTotals() {
    return this.service.getProjectTotals();
  }
}
