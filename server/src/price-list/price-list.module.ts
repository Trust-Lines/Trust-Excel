import { Module } from '@nestjs/common';
import { PriceListController } from './price-list.controller';
import { PriceListService } from './price-list.service';
import { PrismaModule } from '../prisma/prisma.module';
import { DropboxModule } from '../dropbox/dropbox.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [PrismaModule, DropboxModule, ProjectsModule],
  controllers: [PriceListController],
  providers: [PriceListService],
})
export class PriceListModule {}
