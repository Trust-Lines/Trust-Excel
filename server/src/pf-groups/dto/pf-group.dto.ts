import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, ValidateIf, IsIn } from 'class-validator';
import { ProjectItemType } from '@prisma/client';

/**
 * Identifies one (project, type) entry to add — either as a brand-new group's
 * first member, or as the next member of an existing group.
 */
export class PfGroupTargetDto {
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ValidateIf((o) => !o.customTypeId)
  @IsEnum(ProjectItemType, { message: 'type must be a valid PF type, or provide customTypeId instead' })
  type?: ProjectItemType;

  @ValidateIf((o) => !o.type)
  @IsString()
  @IsNotEmpty()
  customTypeId?: string;

  // Which existing tier (rank) to join, when adding to a group that already has
  // members. Omitted (or a rank that doesn't actually exist yet) falls back to
  // rank 1 for an empty group, or a brand-new tier at the end otherwise.
  @IsOptional()
  @IsInt()
  @Min(1)
  rank?: number;
}

export const REORDER_DIRECTIONS = ['up', 'down'] as const;
export type ReorderDirection = typeof REORDER_DIRECTIONS[number];

export class ReorderPfGroupMemberDto {
  @IsIn(REORDER_DIRECTIONS as unknown as string[])
  direction: ReorderDirection;
}
