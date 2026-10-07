import { IsString, IsNotEmpty, IsOptional, IsEnum, IsIn, ValidateIf } from 'class-validator';
import { ProjectItemType } from '@prisma/client';

export const TODAY_PF_KINDS = ['PF', 'ORDER', 'FOLLOWUP'] as const;
export type TodayPfKind = typeof TODAY_PF_KINDS[number];

export class CreateTodayPfFlagDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  // ORDER flags target one specific PF (project item); type is derived from it.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  itemId?: string;

  @ValidateIf((o) => !o.customTypeId && !o.itemId)
  @IsEnum(ProjectItemType, { message: 'type must be a valid PF type, or provide customTypeId instead' })
  type?: ProjectItemType;

  @ValidateIf((o) => !o.type && !o.itemId)
  @IsString()
  @IsNotEmpty()
  customTypeId?: string;

  @IsOptional()
  @IsIn(TODAY_PF_KINDS as unknown as string[])
  kind?: TodayPfKind;
}
