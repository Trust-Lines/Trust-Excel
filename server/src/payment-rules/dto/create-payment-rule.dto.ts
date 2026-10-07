import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePaymentRuleDto {
  @IsString({ message: 'Payment rule value must be a string' })
  @IsNotEmpty({ message: 'Payment rule value cannot be empty' })
  @MinLength(1, { message: 'Payment rule value must be at least 1 character' })
  @MaxLength(100, { message: 'Payment rule value cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  value: string;
}