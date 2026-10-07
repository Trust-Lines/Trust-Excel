import { Module } from '@nestjs/common';
import { CustomTypesService } from './custom-types.service';
import { CustomTypesController } from './custom-types.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [CustomTypesController],
  providers: [CustomTypesService, PrismaService],
  exports: [CustomTypesService],
})
export class CustomTypesModule {}