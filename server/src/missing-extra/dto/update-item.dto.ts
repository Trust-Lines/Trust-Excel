import { PartialType } from '@nestjs/mapped-types';
import { CreateMissingExtraItemDto } from './create-item.dto';

export class UpdateMissingExtraItemDto extends PartialType(CreateMissingExtraItemDto) {
  // All fields from CreateMissingExtraItemDto become optional automatically
}