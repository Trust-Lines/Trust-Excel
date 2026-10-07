import { Module } from '@nestjs/common';
import { DropboxController } from './dropbox.controller';
import { DropboxService } from './dropbox.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DropboxController],
  providers: [DropboxService],
  exports: [DropboxService],
})
export class DropboxModule {}
