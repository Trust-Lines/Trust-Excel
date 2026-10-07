import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { ProjectBucket } from '@prisma/client';

export class CreateExpensesMEProjectDto {
  @IsEnum(ProjectBucket)
  bucket: ProjectBucket;

  @IsString()
  @IsNotEmpty()
  projectNo: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}
