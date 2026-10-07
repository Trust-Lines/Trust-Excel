import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { PaymentRulesService } from './payment-rules.service';
import { CreatePaymentRuleDto } from './dto/create-payment-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment-rules')
@UseGuards(JwtAuthGuard)
export class PaymentRulesController {
  constructor(private readonly paymentRulesService: PaymentRulesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPaymentRuleDto: CreatePaymentRuleDto) {
    return this.paymentRulesService.create(createPaymentRuleDto);
  }

  @Get()
  findAll() {
    return this.paymentRulesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentRulesService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentRulesService.remove(id);
  }
}