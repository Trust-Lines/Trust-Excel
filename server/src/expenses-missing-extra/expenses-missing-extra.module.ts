import { Module } from '@nestjs/common';
import { ExpensesMissingExtraService } from './expenses-missing-extra.service';
import { ExpensesMissingExtraController } from './expenses-missing-extra.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [ExpensesMissingExtraController],
  providers: [ExpensesMissingExtraService],
  exports: [ExpensesMissingExtraService],
})
export class ExpensesMissingExtraModule {}
