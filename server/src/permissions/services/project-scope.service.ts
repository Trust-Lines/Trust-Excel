import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CacheEntry {
  enabled: boolean;
  idsBySource: Record<string, string[]>;
  cachedAt: number;
}

const CACHE_TTL_MS = 60_000; // 60 seconds

@Injectable()
export class ProjectScopeService {
  private readonly logger = new Logger(ProjectScopeService.name);
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly prisma: PrismaService) {}

  private async loadCache(roleId: string): Promise<CacheEntry> {
    const cached = this.cache.get(roleId);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached;
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { projectScopeEnabled: true },
    });

    if (!role || !role.projectScopeEnabled) {
      const entry: CacheEntry = { enabled: false, idsBySource: {}, cachedAt: Date.now() };
      this.cache.set(roleId, entry);
      return entry;
    }

    const records = await this.prisma.roleProjectScope.findMany({
      where: { roleId },
      select: { projectId: true, sourceType: true },
    });

    const idsBySource: Record<string, string[]> = {};
    for (const r of records) {
      if (!idsBySource[r.sourceType]) idsBySource[r.sourceType] = [];
      idsBySource[r.sourceType].push(r.projectId);
    }

    const entry: CacheEntry = { enabled: true, idsBySource, cachedAt: Date.now() };
    this.cache.set(roleId, entry);
    return entry;
  }

  /**
   * Get assigned project IDs for a role (main projects only, sourceType='project').
   * Returns null if scope is NOT enabled (= all projects allowed).
   * Returns empty array if scope is enabled but no projects assigned (= NO projects visible).
   */
  async getAssignedProjectIds(roleId: string): Promise<string[] | null> {
    const entry = await this.loadCache(roleId);
    if (!entry.enabled) return null;
    return entry.idsBySource['project'] || [];
  }

  /**
   * Get assigned IDs for a specific source type.
   * Returns null if scope is NOT enabled.
   */
  async getAssignedIdsBySource(roleId: string, sourceType: string): Promise<string[] | null> {
    const entry = await this.loadCache(roleId);
    if (!entry.enabled) return null;
    return entry.idsBySource[sourceType] || [];
  }

  /**
   * Get ALL assigned IDs across all sources.
   * Returns null if scope is NOT enabled.
   */
  async getAllAssignedIds(roleId: string): Promise<Record<string, string[]> | null> {
    const entry = await this.loadCache(roleId);
    if (!entry.enabled) return null;
    return entry.idsBySource;
  }

  /**
   * Check if project scope is enabled for a role.
   */
  async isProjectScopeEnabled(roleId: string): Promise<boolean> {
    const entry = await this.loadCache(roleId);
    return entry.enabled;
  }

  /**
   * Build a Prisma WHERE fragment for filtering projects by scope.
   * Returns null if no filtering is needed (all projects allowed).
   */
  async buildProjectWhere(roleId: string): Promise<Record<string, any> | null> {
    const projectIds = await this.getAssignedProjectIds(roleId);

    if (projectIds === null) {
      return null;
    }

    return { id: { in: projectIds } };
  }

  /**
   * Get assigned project numbers + buckets for matching expenses projects.
   * Returns null if no scope configured.
   */
  async getAssignedProjectRefs(roleId: string): Promise<Array<{ projectNo: string; bucket: string }> | null> {
    const projectIds = await this.getAssignedProjectIds(roleId);
    if (projectIds === null) return null;
    if (projectIds.length === 0) return [];

    const projects = await this.prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { projectNo: true, bucket: true },
    });

    return projects.map(p => ({ projectNo: p.projectNo, bucket: p.bucket }));
  }

  /**
   * Invalidate cache for a specific role or all roles.
   */
  invalidateCache(roleId?: string): void {
    if (roleId) {
      this.cache.delete(roleId);
      this.logger.debug(`Project scope cache invalidated for role ${roleId}`);
    } else {
      this.cache.clear();
      this.logger.debug('Project scope cache invalidated for all roles');
    }
  }
}
