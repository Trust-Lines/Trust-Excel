import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { SupplierTotalsService } from './supplier-totals.service';

@Controller('supplier-totals')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('suppliers_vendors')
export class SupplierTotalsController {
  constructor(private readonly service: SupplierTotalsService) {}

  @Get()
  getSupplierTotals() {
    return this.service.getSupplierTotals();
  }
}
