import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
