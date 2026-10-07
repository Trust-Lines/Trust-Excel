import { Module } from '@nestjs/common';
import { TodayPfService } from './today-pf.service';
import { TodayPfController } from './today-pf.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [TodayPfController],
  providers: [TodayPfService],
  exports: [TodayPfService],
})
export class TodayPfModule {}
