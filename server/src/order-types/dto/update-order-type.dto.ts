import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateOrderTypeDto } from './create-order-type.dto';

export class UpdateOrderTypeDto extends PartialType(CreateOrderTypeDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}