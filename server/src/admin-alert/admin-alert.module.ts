import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../email/email.module';
import { AdminAlertService } from './admin-alert.service';
import { AdminAlertTestController } from './admin-alert-test.controller';

@Global()
@Module({
  imports: [ConfigModule, EmailModule],
  controllers: [AdminAlertTestController],
  providers: [AdminAlertService],
  exports: [AdminAlertService],
})
export class AdminAlertModule {}
