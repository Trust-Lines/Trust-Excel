import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectTotalsController } from './project-totals.controller';
import { ProjectTotalsService } from './project-totals.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectTotalsController],
  providers: [ProjectTotalsService],
})
export class ProjectTotalsModule {}
