import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { applyStatusDateAutomation } from '../common/helpers/status-date-automation';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectItemDto } from './dto/create-project-item.dto';
import { UpdateProjectItemDto } from './dto/update-project-item.dto';
import { BulkAssignHalfDto } from './dto/bulk-assign-half.dto';
import {
  ProjectWithRelations,
  ProjectItemWithVendor,
  PaginatedProjectsResponse
} from './dto/project-response.dto';

import { PfCodeGenerationService } from './services/pf-code-generation.service';
import { CustomTypesService } from '../custom-types/custom-types.service';
import { AccessControlService } from '../permissions/services/access-control.service';
import { ProjectScopeService } from '../permissions/services/project-scope.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { SupplierTotalsService } from '../supplier-totals/supplier-totals.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notifications/notification.service';
import { DropboxService } from '../dropbox/dropbox.service';
import { TodayPfService } from '../today-pf/today-pf.service';
import { ProjectStatus, ProjectBucket, Prisma } from '@prisma/client';

export interface ProjectListQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: ProjectStatus;
  bucket?: ProjectBucket;
  search?: string;
}

/**
 * Why we cap /api/projects pagination instead of returning everything:
 *
 *   1. Performance safety  — every project pulls its `items` (with vendor +
 *      customType joins). An unbounded query at 10k+ projects would fan out
 *      to a multi-second response and pin the DB connection.
 *   2. Browser stability   — the operational table renders one ProjectBlock
 *      per project, each with N rows of editors. Dumping the whole table in
 *      one go starves the main thread and blows React reconciliation budget.
 *   3. API protection      — the endpoint is reachable from any authenticated
 *      session. A hard ceiling prevents a buggy or hostile client from asking
 *      the server to materialize the entire dataset in a single request.
 *
 * Clients (including the operational board) MUST honour `meta.totalPages` and
 * walk pages explicitly. The server will never quietly hand back the full set.
 */
export const DEFAULT_PROJECT_PAGE_SIZE = 50;
export const PROJECT_PAGE_LIMIT_MAX = 200;

// A PF code is only issued while the PO sign status is past NOT_SIGNED.
// PF code appears once the PF sign status reaches WAITING T TO SIGN (or any signed state) — not PO.
const poAllowsPfCode = (status?: string | null): boolean => !!status && status !== 'NOT_SIGNED' && status !== 'READY_TO_SIGN';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly pfCodeGenerationService: PfCodeGenerationService,
    private readonly customTypesService: CustomTypesService,
    private readonly accessControlService: AccessControlService,
    private readonly auditLogService: AuditLogService,
    private readonly projectScopeService: ProjectScopeService,
    private readonly supplierTotalsService: SupplierTotalsService,
    private readonly eventsGateway: EventsGateway,
    private readonly notificationService: NotificationService,
    private readonly dropboxService: DropboxService,
    private readonly todayPfService: TodayPfService,
  ) { }

  /**
   * One-stop helper for audit-log writes that must NOT block the user request.
   * Replaces the historical `.catch(() => {})` pattern: failures are now logged
   * with full context so SREs can spot a broken audit trail.
   */
  private logAuditFailure(context: string, err: unknown): void {
    this.logger.error(
      `audit log write failed: ${context}`,
      err instanceof Error ? err.stack : String(err),
    );
  }

  /**
   * Map Prisma's raw P2002 unique-constraint error into a 400 with a friendly
   * message instead of bubbling out as a 500. Re-throws every other error
   * unchanged so we never accidentally swallow real failures.
   */
  private rethrowAsFriendlyDuplicate(err: unknown, message: string): never {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new BadRequestException(message);
    }
    throw err;
  }

  async create(
    createProjectDto: CreateProjectDto,
    createdByUserId?: string,
  ): Promise<ProjectWithRelations> {
    // Check for duplicate projectNo in same bucket
    const existingProject = await this.prismaService.project.findFirst({
      where: {
        projectNo: createProjectDto.projectNo.trim(),
        bucket: createProjectDto.bucket,
      },
    });

    if (existingProject) {
      throw new BadRequestException(
        'A project with this Project No already exists in this bucket',
      );
    }

    // Use transaction to create project and placeholder line items.
    // The duplicate-projectNo check above is racy (two concurrent POSTs can
    // both pass it). The DB unique constraint @@unique([projectNo, bucket])
    // is the real safety net — translate its P2002 into a friendly 400 below
    // so the loser of the race sees the same message as the winner's victim.
    return this.prismaService.$transaction(async (prisma) => {
      // Create the project first
      let project: Prisma.ProjectGetPayload<{}>;
      try {
        project = await prisma.project.create({
          data: {
            ...createProjectDto,
            projectNo: createProjectDto.projectNo.trim(),
            types: createProjectDto.types || [],
            createdByUserId: createdByUserId || undefined,
          },
        });
      } catch (err) {
        this.rethrowAsFriendlyDuplicate(
          err,
          'A project with this Project No already exists in this bucket',
        );
      }

      // Create placeholder line items for selected types (both enum and custom)
      if (createProjectDto.types && createProjectDto.types.length > 0) {

        const enumTypes = ['MILLWORK', 'SHELVING', 'CEILING', 'IMAGE', 'FURNITURE', 'DECORATION'];
        const itemsToCreate = [];

        for (const typeName of createProjectDto.types) {
          const normalizedType = typeName.trim();

          if (enumTypes.includes(normalizedType.toUpperCase())) {
            // Handle enum types
            itemsToCreate.push({
              projectId: project.id,
              type: normalizedType.toUpperCase() as any,
              customTypeId: null,
              pfCode: null,
              vendorId: null,
              orderType: null,
              pfSignStatus: 'NOT_SIGNED' as any,
              poSignStatus: 'NOT_SIGNED' as any,
              status: 'NOT_ORDERED' as any,
            });
          } else {
            // Handle custom types - create if doesn't exist
            try {
              const customType = await this.customTypesService.createIfNotExists(normalizedType);

              const customItem = {
                projectId: project.id,
                type: null,
                customTypeId: customType.id,
                pfCode: null,
                vendorId: null,
                orderType: null,
                pfSignStatus: 'NOT_SIGNED' as any,
                poSignStatus: 'NOT_SIGNED' as any,
                status: 'NOT_ORDERED' as any,
              };

              itemsToCreate.push(customItem);
            } catch (error) {
              this.logger.error(
                `custom type processing failed for "${normalizedType}": ${(error as Error)?.message ?? error}`,
                (error as Error)?.stack,
              );
              throw error;
            }
          }
        }


        if (itemsToCreate.length > 0) {
          const createdItems = await prisma.projectItem.createMany({
            data: itemsToCreate,
          });
        } else {
          console.warn('⚠️ [PROJECT CREATION] No items to create!');
        }
      }

      // Return project with all relations
      const finalProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
          createdBy: createdByUserId ? {
            select: {
              id: true,
              email: true,
              name: true,
            },
          } : false,
          items: {
            include: {
              vendor: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
              customType: true,
            },
          }, // Include the created line items with custom types
        },
      });


      // AUDIT LOG: Project creation
      if (createdByUserId && finalProject) {
        const userInfo = await this.auditLogService.resolveUser(createdByUserId);
        this.auditLogService.logBatch([{
          domain: 'PROJECT',
          entityId: finalProject.id,
          entityType: 'Project',
          projectRef: finalProject.projectNo,
          field: 'project',
          oldValue: null,
          newValue: `Created: ${finalProject.name} (${finalProject.projectNo})`,
          action: 'CREATE',
          userId: createdByUserId,
          userName: userInfo?.name,
          userRole: userInfo?.role,
        }]).catch(err => this.logAuditFailure(`project create id=${finalProject.id}`, err));
      }

      if (finalProject) {
        this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'project:created', { project: finalProject }, createdByUserId);
      }

      return finalProject;
    }).then(async (created) => {
      // After transaction: create Dropbox folder if all required fields are present.
      // Failure does NOT roll back the project — Dropbox is best-effort.
      const { dropboxSection, dropboxRegion, dropboxStatus, dropboxClientType, clientName } = createProjectDto;
      if (created && dropboxSection && dropboxRegion && dropboxStatus && dropboxClientType) {
        try {
          // "Individuals" is stored in DB but Dropbox folder uses the company's preserved typo "Individiuals"
          const clientTypeFolder = dropboxClientType === 'Individuals' ? 'Individiuals' : dropboxClientType;
          const isClients = dropboxClientType === 'Clients';
          const projectFolderName = `${created.projectNo} - ${created.address}`;
          const parentParts = ['/D-Projects/T LINES', dropboxSection, dropboxRegion, dropboxStatus, clientTypeFolder];
          if (isClients && clientName) parentParts.push(clientName);
          const parentPath = parentParts.join('/');
          const projectFolderPath = `${parentPath}/${projectFolderName}`;

          // Check if the folder already exists in Dropbox before creating
          const existingFolders = await this.dropboxService.listFolders(parentPath).catch(() => []);
          const folderExists = existingFolders.some(
            f => f.name.toLowerCase() === projectFolderName.toLowerCase(),
          );

          if (folderExists) {
            this.logger.log(`Dropbox folder already exists, linking: ${projectFolderPath}`);
          } else {
            await this.dropboxService.ensureFolderPath(projectFolderPath);
            await this.dropboxService.createProjectStructureV2(projectFolderPath);
            this.logger.log(`Dropbox folder created: ${projectFolderPath}`);
          }

          await this.prismaService.project.update({
            where: { id: created.id },
            data: { dropboxPath: projectFolderPath },
          });
          created.dropboxPath = projectFolderPath;
        } catch (err) {
          this.logger.error(`Dropbox folder creation failed for project ${created.id}: ${(err as Error).message}`);
        }
      }
      return created;
    });
  }

  async setupDropboxFolder(
    id: string,
    data: {
      dropboxSection: string;
      dropboxRegion: string;
      dropboxStatus: string;
      dropboxClientType: string;
      clientName?: string;
    },
  ): Promise<{ dropboxPath: string }> {
    const project = await this.prismaService.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');

    // Save the dropbox fields to DB
    await this.prismaService.project.update({
      where: { id },
      data: {
        dropboxSection: data.dropboxSection,
        dropboxRegion: data.dropboxRegion,
        dropboxStatus: data.dropboxStatus,
        dropboxClientType: data.dropboxClientType,
        ...(data.clientName ? { clientName: data.clientName } : {}),
      },
    });

    const clientTypeFolder = data.dropboxClientType === 'Individuals' ? 'Individiuals' : data.dropboxClientType;
    const isClients = data.dropboxClientType === 'Clients';
    const projectFolderName = `${project.projectNo} - ${project.address}`;
    const parentParts = ['/D-Projects/T LINES', data.dropboxSection, data.dropboxRegion, data.dropboxStatus, clientTypeFolder];
    if (isClients && data.clientName) parentParts.push(data.clientName);
    const parentPath = parentParts.join('/');
    const projectFolderPath = `${parentPath}/${projectFolderName}`;

    // Check if folder already exists in Dropbox
    const existingFolders = await this.dropboxService.listFolders(parentPath).catch(() => []);
    const folderExists = existingFolders.some(
      f => f.name.toLowerCase() === projectFolderName.toLowerCase(),
    );

    if (folderExists) {
      this.logger.log(`Dropbox folder already exists, linking: ${projectFolderPath}`);
    } else {
      await this.dropboxService.ensureFolderPath(projectFolderPath);
      await this.dropboxService.createProjectStructureV2(projectFolderPath);
      this.logger.log(`Dropbox folder created via setup: ${projectFolderPath}`);
    }

    await this.prismaService.project.update({
      where: { id },
      data: { dropboxPath: projectFolderPath },
    });

    return { dropboxPath: projectFolderPath };
  }

  async findAll(query: ProjectListQuery, user?: any): Promise<PaginatedProjectsResponse> {
    const {
      page = 1,
      limit = DEFAULT_PROJECT_PAGE_SIZE,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      bucket,
      search,
    } = query;

    // Pagination IS a contract, not a default-stuffing trick.
    // We hard-clamp `limit` so a missing/oversized client param can never
    // ask the server for an unbounded result set. The client (operational
    // board) is expected to walk pages via `meta.totalPages`.
    // See PROJECT_PAGE_LIMIT_MAX comment for the reasoning behind the cap.
    const validatedLimit = Math.min(Math.max(1, limit), PROJECT_PAGE_LIMIT_MAX);
    const validatedPage = Math.max(1, page);
    const skip = (validatedPage - 1) * validatedLimit;

    // Build where clause
    const where: Prisma.ProjectWhereInput = { deletedAt: null };

    if (status) {
      where.status = status;
    }

    if (bucket) {
      where.bucket = bucket;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Build order by clause
    const validSortFields = [
      'name',
      'createdAt',
      'updatedAt',
      'status',
      'address',
      'bucket',
    ];
    const orderByField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy = { [orderByField]: sortOrder };

    // Type visibility filter removed - all items are returned to frontend
    // Frontend handles restricted types with blur display (isRestricted flag)

    // Build project scope filter
    const projectScopeWhere = user?.roleId
      ? await this.projectScopeService.buildProjectWhere(user.roleId)
      : null;

    if (projectScopeWhere) {
      Object.assign(where, projectScopeWhere);
    }

    // Execute queries in parallel
    const [projects, total] = await Promise.all([
      this.prismaService.project.findMany({
        where,
        orderBy,
        skip,
        take: validatedLimit,
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          items: {
            where: { deletedAt: null },
            include: {
              vendor: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
              customType: true,
            },
          },
        },
      }),
      this.prismaService.project.count({ where }),
    ]);

    // ── DIAGNOSTIC LOG (opt-in) ──
    // Defaults to OFF. Enable in non-prod by setting PROJECT_LIST_DEBUG=on.
    // Performs an extra count() and serialises every projectNo, so we never
    // want this on by default in production.
    if (process.env.PROJECT_LIST_DEBUG === 'on') {
      const totalUnfiltered = await this.prismaService.project.count();
      const truncated = total > projects.length;
      this.logger.debug(
        `[PROJECT_LIST] ${JSON.stringify({
          schema: 'public',
          userId: user?.userId ?? user?.id ?? null,
          roleId: user?.roleId ?? null,
          filters: { status: status ?? null, bucket: bucket ?? null, search: search ?? null, sortBy: orderByField, sortOrder },
          pagination: { page: validatedPage, limit: validatedLimit, skip },
          scopeApplied: !!projectScopeWhere,
          totalInDb: totalUnfiltered,
          totalAfterFilters: total,
          returnedCount: projects.length,
          truncatedByLimit: truncated,
          returnedProjectNos: projects.map(p => p.projectNo),
        })}`,
      );
      if (truncated) {
        this.logger.warn(
          `[PROJECT_LIST] pagination truncated ${total - projects.length} project(s); client should walk pages or pass higher limit.`,
        );
      }
    }
    // ── END DIAGNOSTIC LOG ──

    return {
      data: projects,
      meta: {
        total,
        page: validatedPage,
        limit: validatedLimit,
        totalPages: Math.ceil(total / validatedLimit),
      },
    };
  }

  async findOne(id: string, user?: any): Promise<ProjectWithRelations> {
    if (!id) {
      throw new BadRequestException('Project ID is required');
    }

    // Check project scope
    if (user?.roleId) {
      const scopeIds = await this.projectScopeService.getAssignedProjectIds(user.roleId);
      if (scopeIds !== null && !scopeIds.includes(id)) {
        throw new NotFoundException(`Project with ID ${id} not found`);
      }
    }

    const project = await this.prismaService.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        items: {
          include: {
            vendor: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            customType: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    userId?: string,
  ): Promise<ProjectWithRelations> {
    if (!id) {
      throw new BadRequestException('Project ID is required');
    }

    // Light existence check - only fields needed for duplicate check + audit log
    const existingProject = await this.prismaService.project.findUnique({
      where: { id },
      select: { id: true, projectNo: true, bucket: true, name: true, status: true, address: true, types: true },
    });
    if (!existingProject) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Check for duplicate projectNo if projectNo is being updated
    if (updateProjectDto.projectNo && updateProjectDto.projectNo.trim() !== existingProject.projectNo) {
      const duplicateProject = await this.prismaService.project.findFirst({
        where: {
          projectNo: updateProjectDto.projectNo.trim(),
          bucket: updateProjectDto.bucket || existingProject.bucket,
          id: { not: id },
        },
      });

      if (duplicateProject) {
        throw new BadRequestException(
          'A project with this Project No already exists in this bucket',
        );
      }
    }

    let updatedProject: Prisma.ProjectGetPayload<{ include: { createdBy: { select: { id: true; email: true; name: true } } } }>;
    try {
      updatedProject = await this.prismaService.project.update({
        where: { id },
        data: {
          ...updateProjectDto,
          projectNo: updateProjectDto.projectNo ? updateProjectDto.projectNo.trim() : undefined,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (err) {
      // Race-condition fallback: the duplicate-check above can be bypassed by
      // a concurrent rename. Surface the unique constraint as a 400.
      this.rethrowAsFriendlyDuplicate(
        err,
        'A project with this Project No already exists in this bucket',
      );
    }

    // AUDIT LOG: Project update
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      const auditEntries: Array<any> = [];
      const fieldsToTrack = ['name', 'projectNo', 'status', 'bucket', 'address', 'types'];
      for (const field of fieldsToTrack) {
        const newVal = (updateProjectDto as any)[field];
        if (newVal === undefined) continue;
        const oldVal = (existingProject as any)[field];
        const fmt = (v: any) => Array.isArray(v) ? v.join(',') : v?.toString?.() || null;
        if (fmt(oldVal) !== fmt(newVal)) {
          auditEntries.push({
            domain: 'PROJECT',
            entityId: id,
            entityType: 'Project',
            projectRef: existingProject.projectNo,
            field,
            oldValue: fmt(oldVal),
            newValue: fmt(newVal),
            userId,
            userName: userInfo?.name,
            userRole: userInfo?.role,
          });
        }
      }
      if (auditEntries.length > 0) {
        this.auditLogService.logBatch(auditEntries).catch(err =>
          this.logAuditFailure(`project update id=${id} entries=${auditEntries.length}`, err)
        );
      }
    }

    this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'project:updated', { project: updatedProject }, userId);
    return updatedProject;
  }

  async bulkAssignHalf(
    dto: BulkAssignHalfDto,
    userId?: string,
  ): Promise<{ updatedCount: number }> {
    if (!dto.projectIds || dto.projectIds.length === 0) {
      throw new BadRequestException('projectIds is required and must not be empty');
    }

    const { count } = await this.prismaService.project.updateMany({
      where: { id: { in: dto.projectIds } },
      data: {
        halfOfYear: dto.halfOfYear ?? null,
        halfYear: dto.halfYear ?? null,
      },
    });

    // No excludeUserId here (unlike single-project update()): this action is
    // explicitly meant to be seen cross-page in the SAME session too (Projects
    // → Suppliers), not just by other users. The acting tab also does its own
    // local refetch after the PATCH resolves, so this is a harmless duplicate there.
    this.eventsGateway.emitToRooms(
      ['projects', 'suppliers', 'dashboard'],
      'project:updated',
      { projectIds: dto.projectIds },
    );

    return { updatedCount: count };
  }

  async moveRegion(
    id: string,
    newBucket: ProjectBucket,
    userId?: string,
  ): Promise<ProjectWithRelations> {
    if (!id) throw new BadRequestException('Project ID is required');
    if (!newBucket) throw new BadRequestException('Target bucket is required');

    const project = await this.prismaService.project.findUnique({
      where: { id },
      select: { id: true, projectNo: true, bucket: true },
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);

    if (project.bucket === newBucket) {
      throw new BadRequestException('Project is already in this region');
    }

    // Atomic rename + move:
    //   1. Look for an existing project with the same projectNo in the target bucket.
    //   2. If found, suffix it with `_OLD_<ts>` so the target slot frees up.
    //   3. Move the source project into the target bucket.
    // Wrapping both updates in $transaction means a failure on step 3 rolls
    // back the rename in step 2 — no orphaned `_OLD_` rows on partial failure.
    let updated: Prisma.ProjectGetPayload<{ include: { createdBy: { select: { id: true; email: true; name: true } } } }>;
    try {
      updated = await this.prismaService.$transaction(async (tx) => {
        const duplicate = await tx.project.findFirst({
          where: { projectNo: project.projectNo, bucket: newBucket, id: { not: id } },
        });
        if (duplicate) {
          const suffix = `_OLD_${Date.now()}`;
          await tx.project.update({
            where: { id: duplicate.id },
            data: { projectNo: duplicate.projectNo + suffix },
          });
        }
        return tx.project.update({
          where: { id },
          data: { bucket: newBucket },
          include: {
            createdBy: { select: { id: true, email: true, name: true } },
          },
        });
      });
    } catch (err) {
      this.rethrowAsFriendlyDuplicate(
        err,
        'A project with this Project No already exists in the target bucket',
      );
    }

    // Audit log
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      this.auditLogService.log({
        domain: 'PROJECT',
        entityId: id,
        entityType: 'Project',
        projectRef: project.projectNo,
        field: 'bucket',
        oldValue: project.bucket,
        newValue: newBucket,
        userId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(err => this.logAuditFailure(`project moveRegion id=${id} -> ${newBucket}`, err));
    }

    this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'project:updated', { project: updated }, userId);
    return updated;
  }

  async remove(id: string, userId?: string): Promise<{ message: string }> {
    if (!id) {
      throw new BadRequestException('Project ID is required');
    }

    // Light existence check - only fields needed for audit log
    const project = await this.prismaService.project.findUnique({
      where: { id },
      select: { id: true, projectNo: true, name: true },
    });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Soft delete: mark as deleted and create TrashBin entry
    const now = new Date();
    await this.prismaService.$transaction([
      this.prismaService.project.update({ where: { id }, data: { deletedAt: now } }),
      this.prismaService.trashBin.create({
        data: {
          entityType: 'Project',
          entityId: id,
          entityLabel: `${project.name} (${project.projectNo})`,
          moduleGroup: 'projects',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    // AUDIT LOG: Project deletion
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      this.auditLogService.log({
        domain: 'PROJECT',
        entityId: id,
        entityType: 'Project',
        projectRef: project.projectNo,
        field: 'project',
        oldValue: `${project.name} (${project.projectNo})`,
        newValue: null,
        action: 'DELETE',
        userId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(err => this.logAuditFailure(`project delete id=${id}`, err));
    }

    this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'project:deleted', { projectId: id }, userId);
    return { message: 'Project deleted successfully' };
  }

  // ================== PROJECT ITEM CRUD METHODS ==================

  /**
   * Create a new project item
   */
  async createProjectItem(
    projectId: string,
    createItemDto: CreateProjectItemDto,
    userId?: string,
  ): Promise<ProjectItemWithVendor> {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    // Check if project exists
    await this.findOne(projectId);

    // Pre-generate pfCode BEFORE transaction — generatePfCodeSafe can take several seconds
    // and must not hold a DB transaction open while it runs.
    // PF codes only exist once the PF sign status is WAITING T TO SIGN or later (see poAllowsPfCode).
    let prePfCode: string | null = null;
    if (createItemDto.vendorId && poAllowsPfCode(createItemDto.pfSignStatus)) {
      const itemTypeInfo = {
        enumType: createItemDto.type,
        customTypeId: createItemDto.customTypeId,
      };
      prePfCode = await this.pfCodeGenerationService.generatePfCodeSafe(
        projectId,
        createItemDto.vendorId,
        itemTypeInfo,
        5,
        createItemDto.orderType,
      );
    }

    const result = await this.prismaService.$transaction(async (prisma) => {
      const item = await prisma.projectItem.create({
        data: {
          projectId,
          ...createItemDto,
          pfCode: prePfCode ?? undefined,
          status: createItemDto.status || 'NOT_ORDERED',
          std: createItemDto.std ? new Date(createItemDto.std) : undefined,
          etd: createItemDto.etd ? new Date(createItemDto.etd) : undefined,
          rtd: createItemDto.rtd ? new Date(createItemDto.rtd) : undefined,
          ftd: createItemDto.ftd ? new Date(createItemDto.ftd) : undefined,
        },
        include: {
          vendor: { select: { id: true, code: true, name: true } },
          customType: true,
        },
      });
      return item;
    }, { timeout: 15000 });

    // Audit log is fire-and-forget — runs after the transaction so it doesn't hold it open
    if (userId) {
      (async () => {
        try {
          const [project, userInfo] = await Promise.all([
            this.prismaService.project.findUnique({ where: { id: projectId }, select: { projectNo: true } }),
            this.auditLogService.resolveUser(userId),
          ]);
          await this.auditLogService.log({
            domain: 'PROJECT',
            entityId: result.id,
            entityType: 'ProjectItem',
            projectRef: project?.projectNo || null,
            field: 'item',
            oldValue: null,
            newValue: `Created: ${createItemDto.type || 'custom'} item`,
            action: 'CREATE',
            userId,
            userName: userInfo?.name,
            userRole: userInfo?.role,
          });
        } catch (err) {
          this.logAuditFailure(`project-item create id=${result.id}`, err);
        }
      })();
    }

    // Invalidate supplier totals cache after successful item create
    this.supplierTotalsService.invalidateCache();

    this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'project-item:created', { item: result, projectId }, userId);
    return result;
  }

  /**
   * Update an existing project item
   */
  async updateProjectItem(
    itemId: string,
    updateItemDto: UpdateProjectItemDto,
    userId?: string,
  ): Promise<ProjectItemWithVendor> {
    // 🐛 DEBUG: Log incoming payload

    // 🎯 RTR DEBUG 1: Payload status value

    if (!itemId) {
      throw new BadRequestException('Project item ID is required');
    }

    // Pre-transaction: fetch existingItem and run all slow I/O before opening the transaction.
    // generatePfCodeSafe and auditLogService.resolveUser can take seconds — keeping them inside
    // a 5 s Prisma interactive transaction caused the "transaction already closed" errors.
    const existingItem = await this.prismaService.projectItem.findUnique({
      where: { id: itemId },
      include: { vendor: true, customType: true },
    });

    if (!existingItem) {
      throw new NotFoundException('Project item not found');
    }

    const projectId = existingItem.projectId;

    // 🎯 RTR DEBUG 2: Existing item status + rtr

    // 🚨 BEFORE/AFTER LOGGING


    // 🚨 PO SIGN STATUS SPECIFIC DEBUGGING

    if (updateItemDto.status || updateItemDto.poSignStatus) {
    }

    // Check vendor change conditions
    const isVendorChanging = updateItemDto.vendorId && updateItemDto.vendorId !== existingItem.vendorId;
    const isFirstTimeVendorAssign = updateItemDto.vendorId && !existingItem.vendorId;
    const isOrderTypeChanging = updateItemDto.orderType !== undefined && updateItemDto.orderType !== existingItem.orderType;
    let newPfCode = existingItem.pfCode;
    const effectiveVendorId = updateItemDto.vendorId !== undefined ? updateItemDto.vendorId : existingItem.vendorId;

    let orderTypeTrigger = false;
    if (isOrderTypeChanging && effectiveVendorId) {
      const effectiveType = updateItemDto.type !== undefined ? updateItemDto.type : existingItem.type;
      if (effectiveType === 'MILLWORK') {
        const vendor = await this.prismaService.vendor.findUnique({ where: { id: effectiveVendorId }, select: { fixedMillworkCodes: true } });
        orderTypeTrigger = !!vendor?.fixedMillworkCodes;
      }
    }

    // PF code lifecycle is tied to the PF sign status: no code before WAITING T TO SIGN;
    // moving to READY_TO_SIGN / WAITING_* / SIGNED issues it, moving back to NOT_SIGNED removes it.
    const wasPoAllowed = poAllowsPfCode(existingItem.pfSignStatus);
    const poAllowsCode = poAllowsPfCode(updateItemDto.pfSignStatus !== undefined ? updateItemDto.pfSignStatus : existingItem.pfSignStatus);
    const poJustAllowed = updateItemDto.pfSignStatus !== undefined && !wasPoAllowed && poAllowsCode && !existingItem.pfCode;
    const poJustBlocked = updateItemDto.pfSignStatus !== undefined && wasPoAllowed && !poAllowsCode;

    // Self-heal: an item whose PF sign status already allows a code but never got one
    // (e.g. it was signed while the rule still depended on PO status) gets it on its next edit.
    const missingCode = !existingItem.pfCode && !poJustBlocked;

    const needsPfCodeRegen = (isVendorChanging || isFirstTimeVendorAssign || orderTypeTrigger || poJustAllowed || missingCode) && effectiveVendorId && poAllowsCode;

    if (needsPfCodeRegen) {
      try {
        const itemTypeInfo = {
          enumType: (updateItemDto.type !== undefined ? updateItemDto.type : existingItem.type) || undefined,
          customTypeId: existingItem.customTypeId || undefined,
        };
        const effectiveOrderType = updateItemDto.orderType !== undefined ? updateItemDto.orderType : existingItem.orderType;
        newPfCode = await this.pfCodeGenerationService.generatePfCodeSafe(
          projectId,
          effectiveVendorId,
          itemTypeInfo,
          5,
          effectiveOrderType,
          itemId,
        );
      } catch (error) {
        this.logger.error(
          `PF code generation failed: ${(error as Error)?.message ?? error}`,
          (error as Error)?.stack,
        );
        throw error;
      }
    } else if (updateItemDto.vendorId === null && existingItem.vendorId) {
      newPfCode = null;
    } else if (effectiveVendorId && (poJustBlocked || ((isVendorChanging || isFirstTimeVendorAssign) && !poAllowsCode))) {
      newPfCode = null;
    }

    const updateData: any = { ...updateItemDto };
    delete updateData.pfCode;

    if (updateItemDto.poSignStatus !== undefined) updateData.poSignStatus = updateItemDto.poSignStatus;
    if (updateItemDto.pfSignStatus !== undefined) updateData.pfSignStatus = updateItemDto.pfSignStatus;
    if (updateItemDto.status !== undefined) updateData.status = updateItemDto.status;

    if (updateItemDto.std) updateData.std = new Date(updateItemDto.std);
    if (updateItemDto.etd) updateData.etd = new Date(updateItemDto.etd);
    if (updateItemDto.rtd) updateData.rtd = new Date(updateItemDto.rtd);
    if (updateItemDto.rtr) updateData.rtr = new Date(updateItemDto.rtr);
    if (updateItemDto.ftd) updateData.ftd = new Date(updateItemDto.ftd);
    if (updateItemDto.rdy) updateData.rdy = new Date(updateItemDto.rdy);
    if (updateItemDto.snd) updateData.snd = new Date(updateItemDto.snd);

    if (updateItemDto.paidUsd1Date !== undefined) updateData.paidUsd1Date = updateItemDto.paidUsd1Date ? new Date(updateItemDto.paidUsd1Date) : null;
    if (updateItemDto.paidUsd2Date !== undefined) updateData.paidUsd2Date = updateItemDto.paidUsd2Date ? new Date(updateItemDto.paidUsd2Date) : null;
    if (updateItemDto.paidTl1Date !== undefined) updateData.paidTl1Date = updateItemDto.paidTl1Date ? new Date(updateItemDto.paidTl1Date) : null;
    if (updateItemDto.paidTl2Date !== undefined) updateData.paidTl2Date = updateItemDto.paidTl2Date ? new Date(updateItemDto.paidTl2Date) : null;
    if (updateItemDto.invoiceDate !== undefined) updateData.invoiceDate = updateItemDto.invoiceDate ? new Date(updateItemDto.invoiceDate) : null;

    if (updateItemDto.pfUsd !== undefined) updateData.pfUsd = updateItemDto.pfUsd;
    if (updateItemDto.pfTl !== undefined) updateData.pfTl = updateItemDto.pfTl;

    if (updateItemDto.paidUsd1 !== undefined) {
      updateData.paidUsd1 = updateItemDto.paidUsd1;
    }
    if (updateItemDto.paidUsd2 !== undefined) {
      updateData.paidUsd2 = updateItemDto.paidUsd2;
    }
    if (updateItemDto.paidTl1 !== undefined) {
      updateData.paidTl1 = updateItemDto.paidTl1;
    }
    if (updateItemDto.paidTl2 !== undefined) {
      updateData.paidTl2 = updateItemDto.paidTl2;
    }
    if (updateItemDto.invoice !== undefined) updateData.invoice = updateItemDto.invoice;
    if (updateItemDto.invoiceTl !== undefined) updateData.invoiceTl = updateItemDto.invoiceTl;
    if (updateItemDto.priceNotes !== undefined) updateData.priceNotes = updateItemDto.priceNotes;

    if (updateItemDto.status !== undefined) {
      const dateUpdates = applyStatusDateAutomation(
        existingItem.status,
        updateItemDto.status,
        existingItem,
        { rtrField: 'rtr', hasRtd: true },
      );
      Object.assign(updateData, dateUpdates);
    }

    if (newPfCode !== existingItem.pfCode) {
      updateData.pfCode = newPfCode;
    }


    // Pre-fetch project info and resolve user BEFORE the transaction to keep it short
    let preProject: { projectNo: string | null } | null = null;
    let preUserInfo: any = null;
    if (userId) {
      [preProject, preUserInfo] = await Promise.all([
        this.prismaService.project.findUnique({ where: { id: projectId }, select: { projectNo: true } }),
        this.auditLogService.resolveUser(userId),
      ]);
    }

    // Transaction contains ONLY the item update — no logs, no extra reads.
    // Changelog and audit are written after the transaction closes to avoid timeout.
    const result = await this.prismaService.$transaction(async (prisma) => {
      return prisma.projectItem.update({
        where: { id: itemId },
        data: updateData,
        include: {
          vendor: { select: { id: true, code: true, name: true } },
          customType: true,
        },
      });
    }, { timeout: 15000 });

    // Today's PFs: if pfCode just went from empty to filled, check whether this
    // completes an active flag for this item's (project, type) group. Fire-and-forget.
    if (!existingItem.pfCode?.trim() && result.pfCode?.trim()) {
      this.todayPfService
        .checkAndCompleteFlags(projectId, result.type, result.customTypeId)
        .catch(err => this.logger.error('today-pf completion check failed:', (err as Error)?.message));
    }
    // "To order" list: an item moving out of not-ordered/hold may complete its group.
    if (result.status !== existingItem.status) {
      this.todayPfService
        .checkAndCompleteFlags(projectId, result.type, result.customTypeId, 'ORDER', result.id)
        .catch(err => this.logger.error('today-pf order completion check failed:', (err as Error)?.message));
    }

    // Changelog writes — outside transaction, fire-and-forget on failure
    const changeLogPromises: Promise<any>[] = [];
    const db = this.prismaService;

    if (updateItemDto.status && existingItem.status !== updateItemDto.status) {
      changeLogPromises.push(db.projectItemChangeLog.create({ data: { projectId, projectItemId: itemId, field: 'status', oldValue: existingItem.status || null, newValue: updateItemDto.status, changedByUserId: userId || null } }));
    }
    if (updateItemDto.poSignStatus && existingItem.poSignStatus !== updateItemDto.poSignStatus) {
      changeLogPromises.push(db.projectItemChangeLog.create({ data: { projectId, projectItemId: itemId, field: 'poSignStatus', oldValue: existingItem.poSignStatus || null, newValue: updateItemDto.poSignStatus, changedByUserId: userId || null } }));
    }
    if (updateItemDto.pfSignStatus && existingItem.pfSignStatus !== updateItemDto.pfSignStatus) {
      changeLogPromises.push(db.projectItemChangeLog.create({ data: { projectId, projectItemId: itemId, field: 'pfSignStatus', oldValue: existingItem.pfSignStatus || null, newValue: updateItemDto.pfSignStatus, changedByUserId: userId || null } }));
    }
    if (('std' in updateData) || (updateItemDto.std && existingItem.std?.toISOString() !== new Date(updateItemDto.std).toISOString())) {
      changeLogPromises.push(db.projectItemChangeLog.create({ data: { projectId, projectItemId: itemId, field: 'std', oldValue: existingItem.std?.toISOString() || null, newValue: updateData.std?.toISOString() || updateItemDto.std, changedByUserId: userId || null } }));
    }
    if (('rtd' in updateData) || (updateItemDto.rtd && existingItem.rtd?.toISOString() !== new Date(updateItemDto.rtd).toISOString())) {
      changeLogPromises.push(db.projectItemChangeLog.create({ data: { projectId, projectItemId: itemId, field: 'rtd', oldValue: existingItem.rtd?.toISOString() || null, newValue: updateData.rtd?.toISOString() || updateItemDto.rtd, changedByUserId: userId || null } }));
    }
    if (('rtr' in updateData) || (updateItemDto.rtr && existingItem.rtr?.toISOString() !== new Date(updateItemDto.rtr).toISOString())) {
      changeLogPromises.push(db.projectItemChangeLog.create({ data: { projectId, projectItemId: itemId, field: 'rtr', oldValue: existingItem.rtr?.toISOString() || null, newValue: updateData.rtr?.toISOString() || updateItemDto.rtr, changedByUserId: userId || null } }));
    }
    Promise.all(changeLogPromises).catch(err => this.logAuditFailure('projectItemChangeLog batch', err));

    // Audit log — also outside transaction, fully fire-and-forget
    if (userId) {
      const auditEntries: Array<{
        domain: string; entityId: string; entityType: string;
        projectRef?: string; field: string; oldValue?: string | null;
        newValue?: string | null; action?: string; userId: string;
        userName?: string; userRole?: string;
      }> = [];

      const fieldsToTrack: Array<{ key: string; format?: (v: any) => string | null }> = [
        { key: 'status' }, { key: 'poSignStatus' }, { key: 'pfSignStatus' }, { key: 'orderType' },
        { key: 'pfUsd', format: (v: any) => v?.toString() || null },
        { key: 'pfTl', format: (v: any) => v?.toString() || null },
        { key: 'std', format: (v: any) => v?.toISOString?.() || v || null },
        { key: 'etd', format: (v: any) => v?.toISOString?.() || v || null },
        { key: 'rtd', format: (v: any) => v?.toISOString?.() || v || null },
        { key: 'rtr', format: (v: any) => v?.toISOString?.() || v || null },
        { key: 'ftd', format: (v: any) => v?.toISOString?.() || v || null },
        { key: 'containerNo' }, { key: 'containerDate', format: (v: any) => v?.toISOString?.() || v || null },
        { key: 'paymentRule' },
        { key: 'paidUsd1', format: (v: any) => v?.toString() || null },
        { key: 'paidUsd2', format: (v: any) => v?.toString() || null },
        { key: 'paidTl1', format: (v: any) => v?.toString() || null },
        { key: 'paidTl2', format: (v: any) => v?.toString() || null },
        { key: 'invoiceTransactionNo' }, { key: 'invoiceNumber' }, { key: 'quickBook' },
      ];

      for (const { key, format } of fieldsToTrack) {
        const newVal = updateData[key] !== undefined ? updateData[key] : updateItemDto[key];
        if (newVal === undefined) continue;
        const oldRaw = (existingItem as any)[key];
        const fmt = format || ((v: any) => v?.toString?.() || v || null);
        const oldStr = fmt(oldRaw);
        const newStr = fmt(newVal);
        if (oldStr !== newStr) {
          auditEntries.push({ domain: 'PROJECT', entityId: itemId, entityType: 'ProjectItem', projectRef: preProject?.projectNo || null, field: key, oldValue: oldStr, newValue: newStr, userId, userName: preUserInfo?.name, userRole: preUserInfo?.role });
        }
      }

      const newVendorId = updateData.vendorId !== undefined ? updateData.vendorId : updateItemDto.vendorId;
      if (newVendorId !== undefined && (existingItem as any).vendorId !== newVendorId) {
        const oldVendorName = (existingItem as any).vendor?.name || null;
        let newVendorName: string | null = null;
        if (newVendorId) {
          const newVendor = await this.prismaService.vendor.findUnique({ where: { id: newVendorId }, select: { name: true } });
          newVendorName = newVendor?.name || newVendorId;
        }
        auditEntries.push({ domain: 'PROJECT', entityId: itemId, entityType: 'ProjectItem', projectRef: preProject?.projectNo || null, field: 'vendor', oldValue: oldVendorName, newValue: newVendorName, userId, userName: preUserInfo?.name, userRole: preUserInfo?.role });
      }

      if (auditEntries.length > 0) {
        this.auditLogService.logBatch(auditEntries).catch(err =>
          this.logAuditFailure(`project-item update entries=${auditEntries.length}`, err)
        );
      }
    }

    // Invalidate supplier totals cache after successful item write
    this.supplierTotalsService.invalidateCache();

    this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'project-item:updated', { item: result, projectId: result?.projectId }, userId);

    // Patch-based event: emit only changed fields for cell-level live updates
    if (result && userId) {
      // Build patch from the DTO fields that were sent (these are the intentional changes)
      const patch: Record<string, any> = {};
      for (const key of Object.keys(updateItemDto)) {
        if (['id', 'createdAt', 'projectId'].includes(key)) continue;
        const val = (result as any)[key];
        patch[key] = val instanceof Date ? val.toISOString() : val;
      }
      // Include vendor object when vendorId changes so other users see the name
      if (updateItemDto.vendorId !== undefined && (result as any).vendor) {
        patch.vendor = (result as any).vendor;
      }
      // Include customType object when customTypeId changes
      if ((updateItemDto as any).customTypeId !== undefined && (result as any).customType) {
        patch.customType = (result as any).customType;
      }
      // Also include auto-computed fields that may have changed (pfCode, updatedAt, auto-dates)
      if ((result as any).pfCode !== undefined) patch.pfCode = (result as any).pfCode;
      // Include all auto-generated date fields from status automation
      const autoDateFields = ['std', 'etd', 'rtr', 'rtd', 'rdy', 'ftd', 'snd'];
      for (const df of autoDateFields) {
        if (!(df in patch)) {
          const val = (result as any)[df];
          patch[df] = val instanceof Date ? val.toISOString() : val ?? null;
        }
      }

      this.eventsGateway.emitPatchEvent(['projects', 'suppliers', 'dashboard'], {
        entity: 'projectItem',
        entityId: itemId,
        parentId: result.projectId,
        patch,
        updatedAt: (result as any).updatedAt?.toISOString?.() || new Date().toISOString(),
        updatedBy: userId,
        mutationId: EventsGateway.generateMutationId(),
      });
    }

    // Fire-and-forget: check if all items are SENT → mark project DONE + email admins
    if (updateItemDto.status === 'SENT' && result?.projectId) {
      this.notificationService.checkProjectCompletion(result.projectId).catch(err =>
        this.logger.error(`notification.checkProjectCompletion failed for projectId=${result.projectId}`, err instanceof Error ? err.stack : String(err))
      );
    }

    return result;
  }

  /**
   * DEBUG: Get raw DB values for a project item
   */
  async debugProjectItem(_projectId: string, itemId: string): Promise<{
    id: string;
    poSignStatus: string;
    pfSignStatus: string;
    status: string | null;
    std: string | null;
    rtd: string | null;
    etd: string | null;
    ftd: string | null;
    updatedAt: string;
  }> {
    if (!itemId) {
      throw new BadRequestException('Item ID is required');
    }

    const rawItem = await this.prismaService.projectItem.findUnique({
      where: { id: itemId },
      select: {
        id: true,
        poSignStatus: true,
        pfSignStatus: true,
        status: true,
        std: true,
        rtd: true,
        etd: true,
        ftd: true,
        updatedAt: true
      }
    });

    if (!rawItem) {
      throw new NotFoundException('Project item not found');
    }


    return {
      id: rawItem.id,
      poSignStatus: rawItem.poSignStatus,
      pfSignStatus: rawItem.pfSignStatus,
      status: rawItem.status,
      std: rawItem.std?.toISOString() || null,
      rtd: rawItem.rtd?.toISOString() || null,
      etd: rawItem.etd?.toISOString() || null,
      ftd: rawItem.ftd?.toISOString() || null,
      updatedAt: rawItem.updatedAt.toISOString()
    };
  }

  /**
   * Simulate PF code generation without saving (for debug purposes)
   */
  async simulatePfCodeGeneration(
    projectId: string,
    vendorId: string,
    itemType: any
  ): Promise<string> {
    // Convert legacy itemType parameter to new ItemTypeInfo format
    let itemTypeInfo: { enumType?: any; customTypeId?: string };
    if (typeof itemType === 'string') {
      // Assume it's an enum type
      itemTypeInfo = { enumType: itemType as any };
    } else if (itemType?.enumType || itemType?.customTypeId) {
      // Already in ItemTypeInfo format
      itemTypeInfo = itemType;
    } else {
      // Default fallback
      itemTypeInfo = { enumType: itemType };
    }

    return this.pfCodeGenerationService.generatePfCodeSafe(
      projectId,
      vendorId,
      itemTypeInfo
    );
  }

  /**
   * Remove a project item
   */
  async removeProjectItem(
    projectId: string,
    itemId: string,
    userId?: string,
  ): Promise<{ message: string }> {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    if (!itemId) {
      throw new BadRequestException('Project item ID is required');
    }

    // Check if project exists
    const project = await this.findOne(projectId);

    // Check if item exists and belongs to project
    const existingItem = await this.prismaService.projectItem.findUnique({
      where: { id: itemId },
      include: { vendor: { select: { name: true } } },
    });

    if (!existingItem) {
      throw new NotFoundException('Project item not found');
    }

    if (existingItem.projectId !== projectId) {
      throw new BadRequestException('Project item does not belong to this project');
    }

    // Soft delete the item and create TrashBin entry
    const now = new Date();
    await this.prismaService.$transaction([
      this.prismaService.projectItem.update({ where: { id: itemId }, data: { deletedAt: now } }),
      this.prismaService.trashBin.create({
        data: {
          entityType: 'ProjectItem',
          entityId: itemId,
          entityLabel: `${existingItem.type || 'Custom'} item in ${project.projectNo}`,
          moduleGroup: 'project-items',
          deletedAt: now,
          deletedByUserId: userId,
          restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          parentId: projectId,
          parentLabel: project.projectNo,
        },
      }),
    ]);

    // AUDIT LOG: Item deletion
    if (userId) {
      const userInfo = await this.auditLogService.resolveUser(userId);
      this.auditLogService.log({
        domain: 'PROJECT',
        entityId: itemId,
        entityType: 'ProjectItem',
        projectRef: project.projectNo,
        field: 'item',
        oldValue: `${existingItem.type || 'custom'} - ${existingItem.vendor?.name || 'no vendor'}`,
        newValue: null,
        action: 'DELETE',
        userId,
        userName: userInfo?.name,
        userRole: userInfo?.role,
      }).catch(err => this.logAuditFailure(`project-item delete id=${itemId}`, err));
    }

    // Invalidate supplier totals cache after successful item delete
    this.supplierTotalsService.invalidateCache();

    this.eventsGateway.emitToRooms(['projects', 'suppliers', 'dashboard'], 'project-item:deleted', { itemId, projectId }, userId);
    return { message: 'Project item deleted successfully' };
  }

  /**
   * Get a specific project item with vendor information
   */
  async findProjectItem(
    projectId: string,
    itemId: string
  ): Promise<ProjectItemWithVendor> {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    if (!itemId) {
      throw new BadRequestException('Project item ID is required');
    }

    // Check if project exists
    await this.findOne(projectId);

    const item = await this.prismaService.projectItem.findUnique({
      where: { id: itemId },
      include: {
        vendor: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        customType: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Project item not found');
    }

    if (item.projectId !== projectId) {
      throw new BadRequestException('Project item does not belong to this project');
    }

    return item;
  }

  /**
   * Get all project items for a project
   * GATE A: Includes V2 column filtering when enabled
   */
  async findProjectItems(projectId: string, user?: any): Promise<ProjectItemWithVendor[]> {
    if (!projectId) {
      throw new BadRequestException('Project ID is required');
    }

    // Performance logging start
    const startTime = Date.now();

    // Check project scope
    if (user?.roleId) {
      const scopeIds = await this.projectScopeService.getAssignedProjectIds(user.roleId);
      if (scopeIds !== null && !scopeIds.includes(projectId)) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
    }

    // Check if project exists
    const project = await this.prismaService.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const itemWhere: any = { projectId };

    const items = await this.prismaService.projectItem.findMany({
      where: itemWhere,
      include: {
        vendor: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        customType: true,
      },
      orderBy: [
        { type: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const dbQueryDuration = Date.now() - startTime;

    // GATE A: Apply V2 column filtering if enabled
    if (user?.userId && this.accessControlService.isV2Enabled('operational-board-grid', user.userId)) {
      const filterStartTime = Date.now();

      const userWithRole = await this.prismaService.user.findUnique({
        where: { id: user.userId },
        include: { role: { include: { roleColumnVisibility: true } } }
      });

      const visibleColumns = await this.accessControlService.getProjectVisibleColumns(user.userId);

      // Log column visibility decisions for each column
      const allColumns = [
        'projectNo', 'type', 'vendor', 'orderType', 'poSignStatus', 'pfSignStatus',
        'status', 'std', 'etd', 'rtd', 'ftd', 'pfUsd', 'pfTl', 'paymentRule',
        'containerNo', 'containerDate', 'pfCode'
      ];

      allColumns.forEach(column => {
        const isVisible = visibleColumns.includes(column);
      });

      // Filter item properties based on visible columns
      const filteredItems = items.map(item => this.filterItemByVisibleColumns(item, visibleColumns));

      const totalDuration = Date.now() - startTime;
      const filterDuration = Date.now() - filterStartTime;


      return filteredItems;
    }

    const totalDuration = Date.now() - startTime;

    return items;
  }

  // =================== FIELD-LEVEL AUTHORIZATION METHODS ===================

  /**
   * Create project with permission check
   */
  async createWithPermissionCheck(
    createProjectDto: CreateProjectDto,
    userId: string,
  ): Promise<ProjectWithRelations> {
    // Load user's role policy to check createProject permission
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Get page permissions from role
    const pagePermissions = typeof user.role.pagePermissions === 'string'
      ? JSON.parse(user.role.pagePermissions)
      : user.role.pagePermissions;

    const canCreateProject = pagePermissions?.createProject ?? true; // Default true for backward compatibility

    if (!canCreateProject) {
      throw new ForbiddenException('You do not have permission to create projects');
    }


    // Permission granted, proceed with creation
    return this.create(createProjectDto, userId);
  }

  /**
   * Create project item with permission check
   */
  async createProjectItemWithPermissionCheck(
    projectId: string,
    createItemDto: CreateProjectItemDto,
    userId: string,
  ): Promise<ProjectItemWithVendor> {
    // Load user's role policy to check canAddItems permission
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Get page permissions from role
    const pagePermissions = typeof user.role.pagePermissions === 'string'
      ? JSON.parse(user.role.pagePermissions)
      : user.role.pagePermissions;

    const canAddItems = pagePermissions?.canAddItems ?? true; // Default true for backward compatibility

    if (!canAddItems) {
      throw new ForbiddenException('You do not have permission to add project items');
    }


    // Permission granted, proceed with creation
    return this.createProjectItem(projectId, createItemDto, userId);
  }

  /**
   * Update project item with field-level authorization
   * GATE A: Integrates V2 permission system when enabled
   */
  async updateProjectItemWithFieldAuthorization(
    itemId: string,
    updateItemDto: UpdateProjectItemDto,
    userId: string,
  ): Promise<ProjectItemWithVendor> {
    // GATE A: Check if V2 permissions are enabled for operational-board-grid
    const isV2Enabled = this.accessControlService.isV2Enabled('operational-board-grid', userId);

    if (isV2Enabled) {
      // Use V2 field authorization system - simplified integration
      const v2Decision = await this.checkV2Permissions(userId, itemId, updateItemDto);

      // Standardized V2 logging for each field
      const userFields = Object.keys(updateItemDto).filter(field =>
        !['id', 'createdAt', 'updatedAt', 'projectId'].includes(field)
      );

      for (const field of userFields) {
      }

      if (!v2Decision.allowed) {
        throw new ForbiddenException(v2Decision.reason);
      }

      // Continue with existing update logic (fallthrough to legacy system)
    }

    // Continue with legacy system
    // Load user's role policy to get column permissions
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            roleColumnVisibility: true,
          },
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Build column permissions from role column visibility
    const columnsHidden: string[] = [];
    const columnsReadOnly: string[] = [];

    user.role.roleColumnVisibility.forEach(cv => {
      if (cv.isHidden) {
        columnsHidden.push(cv.columnKey);
      } else if (cv.isReadOnly) {
        columnsReadOnly.push(cv.columnKey);
      }
    });


    // Determine which fields user is trying to update (exclude system fields)
    const systemFields = ['id', 'createdAt', 'updatedAt', 'projectId'];
    const userFields = Object.keys(updateItemDto).filter(field => !systemFields.includes(field));

    // Check if any field is hidden or read-only
    const blockedFields: string[] = [];

    for (const field of userFields) {
      // Map frontend field names to canonical column keys if needed
      const canonicalField = this.mapToCanonicalColumnKey(field);

      if (columnsHidden.includes(canonicalField) || columnsReadOnly.includes(canonicalField)) {
        blockedFields.push(field);
      }
    }

    if (blockedFields.length > 0) {

      throw new ForbiddenException({
        message: 'You do not have permission to edit these fields for your role',
        blockedFields,
        role: user.role.name
      });
    }


    // All fields are editable, proceed with update
    return this.updateProjectItem(itemId, updateItemDto, userId);
  }

  /**
   * Map frontend field names to canonical column keys
   * This ensures consistent naming between frontend and backend
   */
  private mapToCanonicalColumnKey(fieldName: string): string {
    const fieldMap: Record<string, string> = {
      'vendorId': 'vendor',
      'orderTypeId': 'orderType',
      // Add more mappings as needed
    };

    return fieldMap[fieldName] || fieldName;
  }

  /**
   * GATE A: Filter project item properties based on user's visible columns
   * Used by V2 permission system to hide columns from API responses
   * CRITICAL: Hidden fields must NOT appear in API response payload at all
   */
  private filterItemByVisibleColumns(item: ProjectItemWithVendor, visibleColumns: string[]): any {
    // Always include system/relationship fields
    const systemFields = ['id', 'projectId', 'createdAt', 'updatedAt', 'vendor', 'customType', 'pfCode', 'vendorId', 'customTypeId', 'orderType', 'std', 'etd', 'rtd', 'rtr', 'ftd', 'rdy', 'snd', 'containerNo', 'containerDate', 'paymentRule'];

    // Create filtered item starting with system fields
    const filteredItem: any = {};

    // Always include system fields
    systemFields.forEach(field => {
      if (item[field] !== undefined) {
        filteredItem[field] = item[field];
      }
    });

    // Map column keys to actual field names - permission-controlled fields only
    const columnFieldMap: Record<string, string> = {
      'type': 'type',
      'poSignStatus': 'poSignStatus',
      'pfSignStatus': 'pfSignStatus',
      'status': 'status',
      'pfUsd': 'pfUsd',
      'pfTl': 'pfTl',
    };

    // Include visible columns only
    visibleColumns.forEach(columnKey => {
      const fieldName = columnFieldMap[columnKey] || columnKey;
      if (item[fieldName] !== undefined) {
        filteredItem[fieldName] = item[fieldName];
      }
    });

    // VALIDATION: Track hidden fields for strict testing
    const allDataFields = Object.keys(columnFieldMap);
    const hiddenFields = allDataFields.filter(field => !visibleColumns.includes(field));
    const filteredOutFields = hiddenFields.filter(field => {
      const fieldName = columnFieldMap[field];
      return item[fieldName] !== undefined;
    });

    if (filteredOutFields.length > 0) {
    }

    return filteredItem;
  }

  /**
   * GATE A: Check V2 permissions for project item update
   * Simplified integration that logs decisions and enforces in enforce mode
   */
  private async checkV2Permissions(
    userId: string,
    _itemId: string,
    updateData: any
  ): Promise<{ allowed: boolean; reason?: string; metadata?: any }> {
    try {
      // Get user's permissions
      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        include: {
          role: { include: { roleColumnVisibility: true } },
          userAccessPolicy: true
        }
      });

      if (!user) {
        return { allowed: false, reason: 'User not found' };
      }

      // Build column permissions
      const columnsHidden: string[] = [];
      const columnsReadOnly: string[] = [];

      user.role.roleColumnVisibility.forEach(cv => {
        if (cv.isHidden) columnsHidden.push(cv.columnKey);
        else if (cv.isReadOnly) columnsReadOnly.push(cv.columnKey);
      });

      if (user.userAccessPolicy) {
        columnsHidden.push(...(user.userAccessPolicy.columnsHidden || []));
        columnsReadOnly.push(...(user.userAccessPolicy.columnsReadOnly || []));
      }

      // Check update fields
      const systemFields = ['id', 'createdAt', 'updatedAt', 'projectId'];
      const userFields = Object.keys(updateData).filter(field => !systemFields.includes(field));
      const blockedFields: string[] = [];

      for (const field of userFields) {
        const canonicalField = this.mapToCanonicalColumnKey(field);
        if (columnsHidden.includes(canonicalField) || columnsReadOnly.includes(canonicalField)) {
          blockedFields.push(field);
        }
      }

      const allowed = blockedFields.length === 0;
      const decision = {
        allowed,
        reason: allowed ? undefined : `Fields are hidden or read-only for role ${user.role.name}: ${blockedFields.join(', ')}`,
        metadata: {
          userId,
          role: user.role.name,
          blockedFields,
          checkedFields: userFields,
          columnsHidden,
          columnsReadOnly
        }
      };

      return decision;

    } catch (error) {
      this.logger.error(
        `[GATE A V2] permission check failed: ${(error as Error)?.message ?? error}`,
        (error as Error)?.stack,
      );
      return { allowed: false, reason: 'Permission check failed' };
    }
  }
}