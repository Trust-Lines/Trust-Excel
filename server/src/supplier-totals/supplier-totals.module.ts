import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SupplierTotalsController } from './supplier-totals.controller';
import { SupplierTotalsService } from './supplier-totals.service';

@Module({
  imports: [PrismaModule],
  controllers: [SupplierTotalsController],
  providers: [SupplierTotalsService],
  exports: [SupplierTotalsService],
})
export class SupplierTotalsModule {}
