import { Module } from '@nestjs/common';
import { ContainersController } from './containers.controller';
import { ContainersService } from './containers.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContainersController],
  providers: [ContainersService],
  exports: [ContainersService], // Export service for other modules to use
})
export class ContainersModule {}