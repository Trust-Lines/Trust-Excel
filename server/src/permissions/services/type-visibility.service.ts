import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface AllowedTypes {
  enumTypes: string[] | null;
  customTypeIds: string[] | null;
}

interface CacheEntry {
  data: AllowedTypes;
  cachedAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

@Injectable()
export class TypeVisibilityService {
  private readonly logger = new Logger(TypeVisibilityService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get allowed types for a role.
   * Returns { enumTypes: null, customTypeIds: null } if no config exists (= all allowed).
   */
  async getAllowedTypes(roleId: string): Promise<AllowedTypes> {
    const cached = this.cache.get(roleId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    const records = await this.prisma.roleTypeVisibility.findMany({
      where: { roleId },
    });

    // No config = all types allowed
    if (records.length === 0) {
      const result: AllowedTypes = { enumTypes: null, customTypeIds: null };
      this.cache.set(roleId, { data: result, cachedAt: Date.now() });
      return result;
    }

    const enumTypes: string[] = [];
    const customTypeIds: string[] = [];

    for (const record of records) {
      if (record.typeEnum) {
        enumTypes.push(record.typeEnum);
      }
      if (record.customTypeId) {
        customTypeIds.push(record.customTypeId);
      }
    }

    const result: AllowedTypes = {
      enumTypes: enumTypes.length > 0 ? enumTypes : [],
      customTypeIds: customTypeIds.length > 0 ? customTypeIds : [],
    };

    this.cache.set(roleId, { data: result, cachedAt: Date.now() });
    return result;
  }

  /**
   * Build a Prisma WHERE fragment for filtering items by type.
   * Returns null if no filtering is needed (all types allowed).
   */
  async buildItemTypeFilter(roleId: string): Promise<Record<string, any> | null> {
    const allowed = await this.getAllowedTypes(roleId);

    // null means no restriction
    if (allowed.enumTypes === null && allowed.customTypeIds === null) {
      return null;
    }

    const orConditions: Record<string, any>[] = [];

    // Always include unclassified items (type: null AND customTypeId: null)
    orConditions.push({
      type: null,
      customTypeId: null,
    });

    if (allowed.enumTypes && allowed.enumTypes.length > 0) {
      orConditions.push({ type: { in: allowed.enumTypes } });
    }

    if (allowed.customTypeIds && allowed.customTypeIds.length > 0) {
      orConditions.push({ customTypeId: { in: allowed.customTypeIds } });
    }

    // If only unclassified items are allowed (empty arrays for both)
    return { OR: orConditions };
  }

  /**
   * Invalidate cache for a specific role or all roles.
   */
  invalidateCache(roleId?: string): void {
    if (roleId) {
      this.cache.delete(roleId);
      this.logger.debug(`Cache invalidated for role ${roleId}`);
    } else {
      this.cache.clear();
      this.logger.debug('Cache invalidated for all roles');
    }
  }
}
