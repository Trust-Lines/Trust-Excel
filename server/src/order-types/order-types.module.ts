import { Module } from '@nestjs/common';
import { OrderTypesService } from './order-types.service';
import { OrderTypesController } from './order-types.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrderTypesController],
  providers: [OrderTypesService],
  exports: [OrderTypesService]
})
export class OrderTypesModule {}