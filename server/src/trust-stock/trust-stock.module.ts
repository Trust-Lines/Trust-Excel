import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TrustStockService } from './trust-stock.service';
import { TrustStockController } from './trust-stock.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TrustStockController],
  providers: [TrustStockService],
  exports: [TrustStockService],
})
export class TrustStockModule {}
