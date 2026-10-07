import { Module } from '@nestjs/common';
import { TrustExpensesService } from './trust-expenses.service';
import { TrustExpensesController } from './trust-expenses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [TrustExpensesController],
  providers: [TrustExpensesService],
  exports: [TrustExpensesService],
})
export class TrustExpensesModule {}
