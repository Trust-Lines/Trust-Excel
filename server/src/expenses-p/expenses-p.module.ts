import { Module } from '@nestjs/common';
import { ExpensesPService } from './expenses-p.service';
import { ExpensesPController } from './expenses-p.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [ExpensesPController],
  providers: [ExpensesPService],
  exports: [ExpensesPService],
})
export class ExpensesPModule {}
