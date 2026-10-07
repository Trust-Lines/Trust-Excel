import { Module } from '@nestjs/common';
import { PaymentRulesService } from './payment-rules.service';
import { PaymentRulesController } from './payment-rules.controller';

@Module({
  controllers: [PaymentRulesController],
  providers: [PaymentRulesService],
  exports: [PaymentRulesService]
})
export class PaymentRulesModule {}