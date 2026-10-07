import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentRuleDto } from './dto/create-payment-rule.dto';

@Injectable()
export class PaymentRulesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.paymentRuleMaster.findMany({
      orderBy: { value: 'asc' }
    });
  }

  async create(createPaymentRuleDto: CreatePaymentRuleDto) {
    const { value } = createPaymentRuleDto;

    // Normalize the value: trim whitespace and collapse multiple spaces
    const normalizedValue = value.trim().replace(/\s+/g, ' ');

    if (!normalizedValue) {
      throw new ConflictException('Payment rule value cannot be empty');
    }

    try {
      // Try to create the payment rule
      const paymentRule = await this.prisma.paymentRuleMaster.create({
        data: {
          value: normalizedValue
        }
      });

      return paymentRule;
    } catch (error) {
      // Handle unique constraint violation (P2002 in Prisma)
      if (error.code === 'P2002') {
        // Return the existing rule instead of throwing an error
        const existingRule = await this.prisma.paymentRuleMaster.findUnique({
          where: { value: normalizedValue }
        });

        if (existingRule) {
          return existingRule;
        }
      }

      throw error;
    }
  }

  async findOne(id: string) {
    return this.prisma.paymentRuleMaster.findUnique({
      where: { id }
    });
  }

  async remove(id: string) {
    return this.prisma.paymentRuleMaster.delete({
      where: { id }
    });
  }
}