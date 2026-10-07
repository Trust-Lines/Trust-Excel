import { IsString, IsOptional, IsEnum, IsISO8601 } from 'class-validator';

export class GlobalContainerDateDto {
  @IsString()
  containerNo: string;

  @IsOptional()
  @IsISO8601()
  containerDate: string | null;

  @IsString()
  itemId: string;

  @IsString()
  projectId: string;

  @IsEnum(['project', 'directOrder', 'missingExtra'])
  projectType: 'project' | 'directOrder' | 'missingExtra';

  @IsOptional()
  @IsString()
  itemType: string | null;

  @IsISO8601()
  updatedAt: string;
}

export class SyncContainerDateDto {
  @IsString()
  containerNo: string;

  @IsOptional()
  @IsISO8601()
  containerDate: string | null;
}

export class SyncContainerDateResponseDto {
  updated: number;
  details: GlobalContainerDateDto[];
}