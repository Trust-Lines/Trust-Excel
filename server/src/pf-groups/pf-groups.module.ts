import { Module } from '@nestjs/common';
import { PfGroupsService } from './pf-groups.service';
import { PfGroupsController } from './pf-groups.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PfGroupsController],
  providers: [PfGroupsService],
  exports: [PfGroupsService],
})
export class PfGroupsModule {}
