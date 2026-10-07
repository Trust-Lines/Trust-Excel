import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectItemDto } from './create-project-item.dto';

export class UpdateProjectItemDto extends PartialType(CreateProjectItemDto) {
  // All fields from CreateProjectItemDto become optional automatically
}