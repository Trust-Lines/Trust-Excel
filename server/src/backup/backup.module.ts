import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { BackupService } from './backup.service';
import { RestoreService } from './restore.service';
import { BackupController } from './backup.controller';
import { BackupStorage } from './backup-storage';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({ storage: undefined }), // memory storage (buffer)
  ],
  controllers: [BackupController],
  providers: [BackupService, RestoreService, BackupStorage],
  exports: [BackupService],
})
export class BackupModule {}
