import { Controller, Get, Patch, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PageAccessGuard } from '../auth/guards/page-access.guard';
import { RequirePageAccess } from '../auth/decorators/page-access.decorator';
import { SupplierProfilesService } from './supplier-profiles.service';
import { UpdateSupplierProfileDto } from './dto/update-supplier-profile.dto';

@Controller('supplier-profiles')
@UseGuards(JwtAuthGuard, PageAccessGuard)
@RequirePageAccess('suppliers_vendors')
export class SupplierProfilesController {
  constructor(private readonly service: SupplierProfilesService) {}

  @Get(':vendorId')
  getOrCreate(@Param('vendorId') vendorId: string, @Request() req: any) {
    return this.service.getOrCreateByVendorId(vendorId, req.user?.userId || req.user?.id);
  }

  @Patch(':vendorId')
  update(
    @Param('vendorId') vendorId: string,
    @Body() dto: UpdateSupplierProfileDto,
    @Request() req: any,
  ) {
    return this.service.updateByVendorId(vendorId, dto, req.user?.userId || req.user?.id);
  }
}
