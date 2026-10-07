import { Module } from '@nestjs/common';
import { ExpensesDirectOrderService } from './expenses-direct-order.service';
import { ExpensesDirectOrderController } from './expenses-direct-order.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [PrismaModule, PermissionsModule],
  controllers: [ExpensesDirectOrderController],
  providers: [ExpensesDirectOrderService],
  exports: [ExpensesDirectOrderService],
})
export class ExpensesDirectOrderModule {}
