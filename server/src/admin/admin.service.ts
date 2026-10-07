import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { InviteUserDto, InviteUserResponseDto } from './dto/invite-user.dto';
import {
  UpdateRolePolicyDto,
  RolePolicyResponseDto,
  ColumnDefinitionDto,
  RoleWithPolicyDto
} from './dto/role-policy.dto';
import { TypeVisibilityService } from '../permissions/services/type-visibility.service';
import { ProjectScopeService } from '../permissions/services/project-scope.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const PROJECT_ITEM_TYPE_LABELS: Record<string, string> = {
  MILLWORK: 'Millwork',
  SHELVING: 'Shelving',
  CEILING: 'Ceiling',
  IMAGE: 'Image',
  FURNITURE: 'Furniture',
  DECORATION: 'Decoration',
};

// Canonical column registry - Single source of truth
const OPERATIONAL_BOARD_COLUMNS = {
  projectNo: { key: 'projectNo', label: 'Project No', group: 'project', width: '120px', isMoney: false, isEditableByDefault: false, description: 'Project identifier number' },
  type: { key: 'type', label: 'Type', group: 'project', width: '100px', isMoney: false, isEditableByDefault: true, description: 'Project item type' },
  pfCode: { key: 'pfCode', label: 'PF Code', group: 'project', width: '120px', isMoney: false, isEditableByDefault: false, description: 'Auto-generated project code' },
  vendor: { key: 'vendor', label: 'Vendor', group: 'vendor', width: '150px', isMoney: false, isEditableByDefault: true, description: 'Assigned vendor for this item' },
  orderType: { key: 'orderType', label: 'Order Type', group: 'vendor', width: '140px', isMoney: false, isEditableByDefault: true, description: 'Type of order' },
  poSignStatus: { key: 'poSignStatus', label: 'PO Sign Status', group: 'status', width: '130px', isMoney: false, isEditableByDefault: true, description: 'Purchase order signature status' },
  pfSignStatus: { key: 'pfSignStatus', label: 'PF Sign Status', group: 'status', width: '130px', isMoney: false, isEditableByDefault: true, description: 'Project form signature status' },
  status: { key: 'status', label: 'Status', group: 'status', width: '140px', isMoney: false, isEditableByDefault: true, description: 'Current project status' },
  std: { key: 'std', label: 'STD', group: 'dates', width: '110px', isMoney: false, isEditableByDefault: true, description: 'Start To Deliver date' },
  etd: { key: 'etd', label: 'ETD', group: 'dates', width: '110px', isMoney: false, isEditableByDefault: true, description: 'Expected To Deliver date' },
  rtd: { key: 'rtd', label: 'RTD', group: 'dates', width: '110px', isMoney: false, isEditableByDefault: true, description: 'Ready To Deliver date' },
  rtr: { key: 'rtr', label: 'RTR', group: 'dates', width: '110px', isMoney: false, isEditableByDefault: true, description: 'Ready To Receive date' },
  rdy: { key: 'rdy', label: 'RDY', group: 'dates', width: '110px', isMoney: false, isEditableByDefault: false, description: 'Ready date (auto-set when status → READY)' },
  ftd: { key: 'ftd', label: 'FTD', group: 'dates', width: '110px', isMoney: false, isEditableByDefault: true, description: 'Final Target Delivery date' },
  snd: { key: 'snd', label: 'SND', group: 'dates', width: '110px', isMoney: false, isEditableByDefault: false, description: 'Sent date (auto-set when status → SENT)' },
  pfUsd: { key: 'pfUsd', label: 'PF USD', group: 'money', width: '120px', isMoney: true, isEditableByDefault: true, description: 'Project fee in USD' },
  pfTl: { key: 'pfTl', label: 'PF TL', group: 'money', width: '120px', isMoney: true, isEditableByDefault: true, description: 'Project fee in Turkish Lira' },
  invoice: { key: 'invoice', label: 'INV/USD', group: 'money', width: '160px', isMoney: true, isEditableByDefault: true, description: 'Invoice amount in USD' },
  invoiceTl: { key: 'invoiceTl', label: 'INV/TL', group: 'money', width: '160px', isMoney: true, isEditableByDefault: true, description: 'Invoice amount in Turkish Lira' },
  expensesUsd: { key: 'expensesUsd', label: 'Expenses USD', group: 'money', width: '160px', isMoney: true, isEditableByDefault: true, description: 'Expenses amount in USD' },
  expensesTl: { key: 'expensesTl', label: 'Expenses TL', group: 'money', width: '160px', isMoney: true, isEditableByDefault: true, description: 'Expenses amount in Turkish Lira' },
  paymentRule: { key: 'paymentRule', label: 'Payment Rule', group: 'logistics', width: '180px', isMoney: false, isEditableByDefault: true, description: 'Payment agreement terms' },
  containerNo: { key: 'containerNo', label: 'Container No', group: 'logistics', width: '130px', isMoney: false, isEditableByDefault: true, description: 'Container number for shipping' },
  containerDate: { key: 'containerDate', label: 'Container Date', group: 'logistics', width: '140px', isMoney: false, isEditableByDefault: true, description: 'Container shipping date' },
} as const;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private configService: ConfigService,
    private typeVisibilityService: TypeVisibilityService,
    private projectScopeService: ProjectScopeService,
  ) {}

  async inviteUser(inviteData: InviteUserDto, inviterUserId: string): Promise<InviteUserResponseDto> {
    try {
      // Validate role exists
      const role = await this.prisma.role.findUnique({
        where: { id: inviteData.roleId },
      });

      if (!role) {
        throw new BadRequestException('Invalid role specified');
      }

      // Get inviter information for email
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
        select: { name: true, email: true },
      });

      if (!inviter) {
        throw new BadRequestException('Inviter not found');
      }

      // Check if user already exists
      let user = await this.prisma.user.findUnique({
        where: { email: inviteData.email },
      });

      if (user && user.isActive) {
        throw new BadRequestException('User already exists and is active');
      }

      // Generate secure invite token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(token, 10);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      // If user doesn't exist, create them
      if (!user) {
        // Generate temporary password hash (user will set real password during activation)
        const tempPasswordHash = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10);

        user = await this.prisma.user.create({
          data: {
            email: inviteData.email,
            name: inviteData.email.split('@')[0], // Default name from email
            passwordHash: tempPasswordHash,
            roleId: inviteData.roleId,
            isActive: false,
            forcePasswordChange: true,
            invitedAt: new Date(),
          },
        });

        this.logger.log(`Created new user for invitation: ${inviteData.email}`);
      } else {
        // Update existing inactive user (also un-deletes a soft-deleted user)
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            roleId: inviteData.roleId,
            isActive: false,
            forcePasswordChange: true,
            invitedAt: new Date(),
            deletedAt: null,
          },
        });

        this.logger.log(`Updated existing inactive user: ${inviteData.email}`);

        // Remove any stale TrashBin entry so the auto-cleanup job does not
        // permanently delete this re-invited (un-deleted) user later.
        await this.prisma.trashBin.deleteMany({
          where: { entityType: 'User', entityId: user.id },
        });
      }

      // Create invite token
      await this.prisma.inviteToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Create or update user access policy
      const userAccessPolicy = {
        userId: user.id,
        modulePermissions: {}, // Start with empty, can be customized later
        columnsHidden: inviteData.columnsHidden || [],
        columnsReadOnly: inviteData.columnsReadOnly || [],
        rowScopes: inviteData.rowScopes || {},
      };

      await this.prisma.userAccessPolicy.upsert({
        where: { userId: user.id },
        create: userAccessPolicy,
        update: {
          modulePermissions: userAccessPolicy.modulePermissions,
          columnsHidden: userAccessPolicy.columnsHidden,
          columnsReadOnly: userAccessPolicy.columnsReadOnly,
          rowScopes: userAccessPolicy.rowScopes,
        },
      });

      // Generate activation link
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://projects-table.vercel.app');
      const activationLink = `${frontendUrl}/activate?token=${token}`;

      // Send invitation email
      const emailSent = await this.emailService.sendInviteEmail({
        recipientEmail: inviteData.email,
        recipientName: user.name || inviteData.email,
        inviterName: inviter.name || inviter.email,
        activationLink,
        expiresAt,
      });

      if (!emailSent) {
        this.logger.warn(`Failed to send invitation email to ${inviteData.email}, but user was created`);
      }

      this.logger.log(`User invitation completed successfully for ${inviteData.email}`);

      return {
        success: true,
        userId: user.id,
        tokenExpiry: expiresAt,
        emailSent,
        message: emailSent
          ? `Invitation sent successfully to ${inviteData.email}`
          : `User created but email delivery failed. Please share activation link manually.`,
      };

    } catch (error) {
      this.logger.error(`Failed to invite user ${inviteData.email}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to create user invitation');
    }
  }

  async getUsers(search?: string, limit: number = 50, offset: number = 0) {
    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        forcePasswordChange: true,
        invitedAt: true,
        lastLoginAt: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            isSystem: true,
            isActive: true,
          },
        },
        userAccessPolicy: {
          select: {
            columnsHidden: true,
            columnsReadOnly: true,
            rowScopes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.user.count({ where });

    return {
      users,
      total,
      limit,
      offset,
    };
  }

  async updateUser(id: string, data: { roleId?: string; isActive?: boolean }, currentUserId: string) {
    try {
      // Prevent user from modifying themselves
      if (id === currentUserId) {
        throw new BadRequestException('Cannot modify your own account');
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // If updating role, validate it exists
      if (data.roleId) {
        const role = await this.prisma.role.findUnique({
          where: { id: data.roleId },
        });

        if (!role || !role.isActive) {
          throw new BadRequestException('Invalid role specified');
        }
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          forcePasswordChange: true,
          invitedAt: true,
          lastLoginAt: true,
          createdAt: true,
          role: {
            select: {
              id: true,
              name: true,
              isSystem: true,
              isActive: true,
            },
          },
        },
      });

      this.logger.log(`Updated user: ${user.email}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user ${id}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to update user');
    }
  }

  async deleteUser(id: string, currentUserId: string) {
    try {
      // Prevent user from deleting themselves
      if (id === currentUserId) {
        throw new BadRequestException('Cannot delete your own account');
      }

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      // Soft delete: mark user as deleted and create TrashBin entry
      const now = new Date();
      await this.prisma.$transaction([
        this.prisma.user.update({
          where: { id },
          data: { deletedAt: now, isActive: false },
        }),
        this.prisma.trashBin.create({
          data: {
            entityType: 'User',
            entityId: id,
            entityLabel: `${user.name || user.email} (${user.email})`,
            moduleGroup: 'users',
            deletedAt: now,
            deletedByUserId: currentUserId,
            restoreUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          },
        }),
      ]);

      this.logger.log(`Deleted user: ${user.email}`);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete user ${id}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to delete user');
    }
  }

  async resendInvite(id: string, inviterUserId: string) {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.isActive) {
        throw new BadRequestException('User is already active');
      }

      // Get inviter information for email
      const inviter = await this.prisma.user.findUnique({
        where: { id: inviterUserId },
        select: { name: true, email: true },
      });

      if (!inviter) {
        throw new BadRequestException('Inviter not found');
      }

      // Delete any existing invite tokens
      await this.prisma.inviteToken.deleteMany({
        where: { userId: id },
      });

      // Generate new secure invite token
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = await bcrypt.hash(token, 10);
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      // Create new invite token
      await this.prisma.inviteToken.create({
        data: {
          userId: id,
          tokenHash,
          expiresAt,
        },
      });

      // Generate activation link
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'https://projects-table.vercel.app');
      const activationLink = `${frontendUrl}/activate?token=${token}`;

      // Send invitation email
      const emailSent = await this.emailService.sendInviteEmail({
        recipientEmail: user.email,
        recipientName: user.name || user.email,
        inviterName: inviter.name || inviter.email,
        activationLink,
        expiresAt,
      });

      if (!emailSent) {
        this.logger.warn(`Failed to resend invitation email to ${user.email}`);
      }

      this.logger.log(`Resent invitation to ${user.email}`);

      return {
        success: true,
        message: emailSent
          ? `Invitation resent successfully to ${user.email}`
          : `Failed to send email but invitation link updated`,
        tokenExpiry: expiresAt,
      };
    } catch (error) {
      this.logger.error(`Failed to resend invite for user ${id}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to resend invitation');
    }
  }

  async getRoles() {
    return await this.prisma.role.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        isSystem: true,
        isActive: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' },
    });
  }

  async createRole(data: { name: string; description?: string }) {
    try {
      // Check if role with same name already exists
      const existingRole = await this.prisma.role.findFirst({
        where: {
          name: data.name,
          isActive: true
        },
      });

      if (existingRole) {
        throw new BadRequestException('Role with this name already exists');
      }

      const role = await this.prisma.role.create({
        data: {
          name: data.name,
          isSystem: false,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          isSystem: true,
          isActive: true,
          _count: {
            select: { users: true }
          }
        },
      });

      // Auto-create page access entries for the new role (all pages default to false)
      const allPages = await this.prisma.pageRegistry.findMany({ where: { isActive: true } });
      if (allPages.length > 0) {
        await this.prisma.rolePageAccess.createMany({
          data: allPages.map(page => ({
            roleId: role.id,
            pageId: page.id,
            hasAccess: false,
          })),
          skipDuplicates: true,
        });
        this.logger.log(`Created ${allPages.length} page access entries for role: ${data.name}`);
      }

      this.logger.log(`Created new role: ${data.name}`);
      return role;
    } catch (error) {
      this.logger.error(`Failed to create role ${data.name}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to create role');
    }
  }

  async updateRole(id: string, data: { name?: string; isActive?: boolean }) {
    try {
      // Check if role exists and is not system role
      const role = await this.prisma.role.findUnique({
        where: { id },
      });

      if (!role) {
        throw new BadRequestException('Role not found');
      }

      if (role.isSystem) {
        throw new BadRequestException('Cannot modify system role');
      }

      // If updating name, check for conflicts
      if (data.name && data.name !== role.name) {
        const existingRole = await this.prisma.role.findFirst({
          where: {
            name: data.name,
            isActive: true,
            id: { not: id }
          },
        });

        if (existingRole) {
          throw new BadRequestException('Role with this name already exists');
        }
      }

      const updatedRole = await this.prisma.role.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          isSystem: true,
          isActive: true,
          _count: {
            select: { users: true }
          }
        },
      });

      this.logger.log(`Updated role: ${role.name}`);
      return updatedRole;
    } catch (error) {
      this.logger.error(`Failed to update role ${id}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to update role');
    }
  }

  async deleteRole(id: string) {
    try {
      // Check if role exists and is not system role
      const role = await this.prisma.role.findUnique({
        where: { id },
        include: {
          _count: {
            select: { users: true }
          }
        }
      });

      if (!role) {
        throw new BadRequestException('Role not found');
      }

      if (role.isSystem) {
        throw new BadRequestException('Cannot delete system role');
      }

      if (role._count.users > 0) {
        throw new BadRequestException('Cannot delete role with assigned users');
      }

      await this.prisma.role.update({
        where: { id },
        data: { isActive: false },
      });

      this.logger.log(`Deleted role: ${role.name}`);
      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete role ${id}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to delete role');
    }
  }


  async getRoleColumnPolicy(roleId: string) {
    try {
      // Check if role exists
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
        include: {
          roleColumnVisibility: true,
        },
      });

      if (!role) {
        throw new BadRequestException('Role not found');
      }

      // Scope to the operational board only — same tableId condition updateRolePolicy's
      // delete step uses. Without this, a role's Supplier-sheet column overrides (a
      // different tableId, different key set entirely) leak into this response, and
      // since PATCH always round-trips the full arrays it just read, those foreign
      // keys would fail validation and silently block every future save for that role.
      const projectsTable = await this.prisma.tableRegistry.findUnique({
        where: { key: 'operational-board-grid' },
      });
      const operationalBoardVisibility = role.roleColumnVisibility.filter(
        (v) => v.tableId === null || v.tableId === projectsTable?.id,
      );

      // Transform RoleColumnVisibility records into columnsHidden and columnsReadOnly arrays
      const columnsHidden: string[] = [];
      const columnsReadOnly: string[] = [];

      operationalBoardVisibility.forEach((visibility) => {
        if (visibility.isHidden) {
          columnsHidden.push(visibility.columnKey);
        } else if (visibility.isReadOnly) {
          columnsReadOnly.push(visibility.columnKey);
        }
      });

      this.logger.log(`Retrieved column policy for role ${role.name}`);
      return {
        success: true,
        roleId,
        roleName: role.name,
        columnsHidden,
        columnsReadOnly,
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve role column policy for ${roleId}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to retrieve role column policy');
    }
  }

  async updateRoleColumnPolicy(
    roleId: string,
    policy: { columnsHidden?: string[]; columnsReadOnly?: string[] },
  ) {
    try {
      // Check if role exists
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new BadRequestException('Role not found');
      }

      if (role.isSystem) {
        throw new BadRequestException('Cannot modify column policy for system role');
      }

      // Get all column keys from the canonical registry
      const allColumnKeys = Object.keys(OPERATIONAL_BOARD_COLUMNS);

      const columnsHidden = policy.columnsHidden || [];
      const columnsReadOnly = policy.columnsReadOnly || [];

      // Debug logging for validation
      this.logger.log(`Received policy update for role ${roleId}:`);
      this.logger.log(`- columnsHidden: [${columnsHidden.join(', ')}]`);
      this.logger.log(`- columnsReadOnly: [${columnsReadOnly.join(', ')}]`);
      this.logger.log(`- Valid column keys: [${allColumnKeys.join(', ')}]`);

      // Validate that column keys are valid
      const invalidColumns = [...columnsHidden, ...columnsReadOnly].filter(
        (key) => !allColumnKeys.includes(key)
      );

      if (invalidColumns.length > 0) {
        this.logger.error(`Validation failed - Invalid column keys: [${invalidColumns.join(', ')}]`);
        this.logger.error(`Expected keys (camelCase): [${allColumnKeys.join(', ')}]`);
        throw new BadRequestException(`Invalid column keys: ${invalidColumns.join(', ')}. Expected camelCase: ${allColumnKeys.join(', ')}`);
      }

      // ✅ FIX: Get the Projects table ID to scope delete correctly
      const projectsTable = await this.prisma.tableRegistry.findUnique({
        where: { key: 'operational-board-grid' }
      });

      // Build safe delete conditions - never use undefined (Prisma treats it as wildcard)
      const deleteConditions: any[] = [{ tableId: null }]; // Always clean up legacy records
      if (projectsTable?.id) {
        deleteConditions.push({ tableId: projectsTable.id });
      }

      // Delete existing column visibility records for this role - ONLY Projects columns
      await this.prisma.roleColumnVisibility.deleteMany({
        where: {
          roleId,
          OR: deleteConditions,
          columnKey: { in: allColumnKeys }
        },
      });

      // Create new column visibility records
      // ✅ CRITICAL: Projects columns use tableId: null (legacy format)
      // because createRoleBasedPolicy() in auth.service.ts reads them via !tableKey check
      const visibilityRecords = [];

      // Create records for hidden columns
      columnsHidden.forEach((columnKey) => {
        visibilityRecords.push({
          roleId,
          columnKey,
          isHidden: true,
          isReadOnly: false,
          tableId: null,
        });
      });

      // Create records for read-only columns (not hidden)
      columnsReadOnly
        .filter((columnKey) => !columnsHidden.includes(columnKey))
        .forEach((columnKey) => {
          visibilityRecords.push({
            roleId,
            columnKey,
            isHidden: false,
            isReadOnly: true,
            tableId: null,
          });
        });

      // Batch insert new records
      if (visibilityRecords.length > 0) {
        await this.prisma.roleColumnVisibility.createMany({
          data: visibilityRecords,
        });
      }

      this.logger.log(
        `Updated column policy for role ${role.name}: hidden=${columnsHidden.length}, readonly=${columnsReadOnly.length}`
      );

      return {
        success: true,
        message: 'Role column policy updated successfully',
        roleId,
        roleName: role.name,
        columnsHidden,
        columnsReadOnly,
      };
    } catch (error) {
      this.logger.error(`Failed to update role column policy for ${roleId}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to update role column policy');
    }
  }

  async getOperationalBoardColumns(): Promise<ColumnDefinitionDto[]> {
    try {
      // Return the canonical column registry
      return Object.values(OPERATIONAL_BOARD_COLUMNS).map(col => ({
        key: col.key,
        label: col.label,
        group: col.group,
        width: col.width,
        isMoney: col.isMoney,
        isEditableByDefault: col.isEditableByDefault,
        description: col.description
      }));
    } catch (error) {
      this.logger.error('Failed to get operational board columns:', error);
      throw new BadRequestException('Failed to retrieve column definitions');
    }
  }

  async updateRolePolicy(
    roleId: string,
    updatePolicyDto: UpdateRolePolicyDto,
  ): Promise<RolePolicyResponseDto> {
    try {
      // Check if role exists
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new BadRequestException('Role not found');
      }

      if (role.isSystem) {
        throw new BadRequestException('Cannot modify policy for system role');
      }

      // Get all valid column keys from the canonical registry
      const allColumnKeys = Object.keys(OPERATIONAL_BOARD_COLUMNS);

      // Drop any keys that aren't valid operational-board columns instead of
      // rejecting the whole save — a role's policy can carry stale entries
      // (e.g. supplier-sheet column keys from an older permission set) that
      // would otherwise permanently block every future edit to that role,
      // since this array is always sent back in full on each save.
      const invalidColumns = [...(updatePolicyDto.columnsHidden || []), ...(updatePolicyDto.columnsReadOnly || [])].filter(
        (key) => !allColumnKeys.includes(key)
      );
      if (invalidColumns.length > 0) {
        this.logger.warn(`Dropping stale/invalid column keys from role ${roleId} policy: [${[...new Set(invalidColumns)].join(', ')}]`);
      }
      const columnsHidden = (updatePolicyDto.columnsHidden || []).filter((key) => allColumnKeys.includes(key));
      const columnsReadOnly = (updatePolicyDto.columnsReadOnly || []).filter((key) => allColumnKeys.includes(key));

      // Update page permissions if provided
      let updatedRole = role;
      if (updatePolicyDto.pagePermissions) {
        updatedRole = await this.prisma.role.update({
          where: { id: roleId },
          data: {
            pagePermissions: updatePolicyDto.pagePermissions as any,
          },
        });
      }

      // ✅ FIX: Get the Projects table ID to scope delete correctly
      const projectsTable = await this.prisma.tableRegistry.findUnique({
        where: { key: 'operational-board-grid' }
      });

      // Build safe delete conditions - never use undefined (Prisma treats it as wildcard)
      const deleteConditions: any[] = [{ tableId: null }]; // Always clean up legacy records
      if (projectsTable?.id) {
        deleteConditions.push({ tableId: projectsTable.id });
      }

      // Delete existing column visibility records for this role - ONLY Projects columns
      await this.prisma.roleColumnVisibility.deleteMany({
        where: {
          roleId,
          OR: deleteConditions,
          columnKey: { in: allColumnKeys }
        },
      });

      // Create new column visibility records
      // ✅ CRITICAL: Projects columns use tableId: null (legacy format)
      // because createRoleBasedPolicy() in auth.service.ts reads them via !tableKey check
      // Using a CUID tableId would break permission loading since auth compares against key strings
      const visibilityRecords = [];

      // Create records for hidden columns
      columnsHidden.forEach((columnKey) => {
        visibilityRecords.push({
          roleId,
          columnKey,
          isHidden: true,
          isReadOnly: false,
          tableId: null,
        });
      });

      // Create records for read-only columns (not hidden)
      columnsReadOnly
        .filter((columnKey) => !columnsHidden.includes(columnKey))
        .forEach((columnKey) => {
          visibilityRecords.push({
            roleId,
            columnKey,
            isHidden: false,
            isReadOnly: true,
            tableId: null,
          });
        });

      // Batch insert new records
      if (visibilityRecords.length > 0) {
        await this.prisma.roleColumnVisibility.createMany({
          data: visibilityRecords,
        });
      }

      // Get the current page permissions
      const pagePermissions = typeof updatedRole.pagePermissions === 'string'
        ? JSON.parse(updatedRole.pagePermissions)
        : updatedRole.pagePermissions;

      this.logger.log(
        `Updated policy for role ${role.name}: hidden=${columnsHidden.length}, readonly=${columnsReadOnly.length}, pagePermissions=${JSON.stringify(pagePermissions)}`
      );

      return {
        columnsHidden,
        columnsReadOnly,
        pagePermissions,
      };
    } catch (error) {
      this.logger.error(`Failed to update role policy for ${roleId}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Failed to update role policy');
    }
  }

  // ================== GATE B: PROJECTS-ONLY PERMISSION METHODS ==================

  /**
   * Get all roles with Projects (operational-board-grid) specific permissions
   */
  async getProjectsRolesPermissions() {
    try {
      // Projects columns are saved with tableId: null (legacy format)
      // Also check tableId = operational-board-grid for newer records
      const projectsTable = await this.prisma.tableRegistry.findUnique({
        where: { key: 'operational-board-grid' }
      });

      const validColumnKeys = Object.keys(OPERATIONAL_BOARD_COLUMNS);

      // Build OR condition: null tableId (legacy) + actual table ID if exists
      const tableIdCondition: any[] = [{ tableId: null }];
      if (projectsTable?.id) {
        tableIdCondition.push({ tableId: projectsTable.id });
      }

      const roles = await this.prisma.role.findMany({
        where: { isActive: true },
        include: {
          roleColumnVisibility: {
            where: {
              OR: tableIdCondition,
              columnKey: { in: validColumnKeys }
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      // Transform data for UI consumption
      const rolesWithPermissions = roles.map(role => {
        // Parse page permissions for Projects access
        const pagePermissions = typeof role.pagePermissions === 'string'
          ? JSON.parse(role.pagePermissions)
          : role.pagePermissions || {};

        // Build column permissions map
        const columnPermissions: Record<string, { isVisible: boolean; isReadOnly: boolean; requiresApproval: boolean }> = {};

        validColumnKeys.forEach(columnKey => {
          const visibility = role.roleColumnVisibility.find(cv => cv.columnKey === columnKey);
          columnPermissions[columnKey] = {
            isVisible: !visibility?.isHidden,
            isReadOnly: visibility?.isReadOnly || false,
            requiresApproval: visibility?.requiresApproval || false
          };
        });

        return {
          id: role.id,
          name: role.name,
          description: `${role.name} role permissions`, // Generate description since field doesn't exist
          pageAccess: {
            // Projects page access from pagePermissions JSON
            projectsPage: pagePermissions.operationalBoardView ?? true
          },
          tableActions: {
            // DB-driven actions - no hardcoded role-name checks
            canView: true,
            canCreate: pagePermissions.canAddItems ?? false,
            canEdit: pagePermissions.operationalBoardView ?? false,
            canDelete: pagePermissions.canManageMasterData ?? false,
            canExport: pagePermissions.operationalBoardView ?? false,
            canApprove: pagePermissions.canManageMasterData ?? false
          },
          columnPermissions
        };
      });

      this.logger.log(`Retrieved ${rolesWithPermissions.length} roles with Projects permissions`);
      return { roles: rolesWithPermissions };

    } catch (error) {
      this.logger.error('Failed to get Projects roles permissions:', error);
      throw new BadRequestException('Failed to retrieve Projects roles permissions');
    }
  }

  /**
   * Update table actions for a role on Projects table
   */
  async updateProjectsRoleActions(
    roleId: string,
    actions: {
      canView?: boolean;
      canCreate?: boolean;
      canEdit?: boolean;
      canDelete?: boolean;
      canExport?: boolean;
      canApprove?: boolean;
    }
  ) {
    try {
      // Verify role exists
      const role = await this.prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new BadRequestException(`Role with ID ${roleId} not found`);
      }

      // Parse current page permissions
      const currentPagePermissions = typeof role.pagePermissions === 'string'
        ? JSON.parse(role.pagePermissions)
        : role.pagePermissions || {};

      // Update page permissions based on table actions
      const updatedPagePermissions = {
        ...currentPagePermissions,
        operationalBoardView: actions.canView ?? currentPagePermissions.operationalBoardView,
        canAddItems: actions.canCreate ?? currentPagePermissions.canAddItems
      };

      // Update role with new page permissions
      const updatedRole = await this.prisma.role.update({
        where: { id: roleId },
        data: {
          pagePermissions: updatedPagePermissions
        }
      });

      this.logger.log(`Updated Projects table actions for role ${role.name}:`, actions);

      return {
        roleId,
        roleName: role.name,
        updatedActions: actions,
        success: true
      };

    } catch (error) {
      this.logger.error(`Failed to update Projects actions for role ${roleId}:`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update Projects table actions');
    }
  }

  /**
   * Update column permissions for a role on Projects table
   */
  async updateProjectsRoleColumns(
    roleId: string,
    columnPermissions: {
      [columnKey: string]: {
        isVisible?: boolean;
        isReadOnly?: boolean;
        requiresApproval?: boolean;
      };
    }
  ) {
    try {
      // Verify role exists
      const role = await this.prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new BadRequestException(`Role with ID ${roleId} not found`);
      }

      // Get the operational-board-grid table ID
      const projectsTable = await this.prisma.tableRegistry.findUnique({
        where: { key: 'operational-board-grid' }
      });

      if (!projectsTable) {
        throw new BadRequestException('Projects table registry not found');
      }

      // Delete existing column visibility records for this role (Projects columns only)
      await this.prisma.roleColumnVisibility.deleteMany({
        where: {
          roleId,
          tableId: projectsTable.id,
          columnKey: { in: Object.keys(OPERATIONAL_BOARD_COLUMNS) }
        }
      });

      // Create new visibility records
      const visibilityRecords = [];

      Object.entries(columnPermissions).forEach(([columnKey, permissions]) => {
        // Only process Projects columns
        if (OPERATIONAL_BOARD_COLUMNS[columnKey]) {
          const isHidden = permissions.isVisible === false;
          const isReadOnly = permissions.isReadOnly === true;
          const requiresApproval = permissions.requiresApproval === true;

          // Create record if column is hidden or read-only or requires approval
          if (isHidden || isReadOnly || requiresApproval) {
            visibilityRecords.push({
              roleId,
              columnKey,
              isHidden,
              isReadOnly,
              requiresApproval,
              tableId: projectsTable.id
            });
          }
        }
      });

      // Batch insert new records
      if (visibilityRecords.length > 0) {
        await this.prisma.roleColumnVisibility.createMany({
          data: visibilityRecords
        });
      }

      this.logger.log(`Updated Projects column permissions for role ${role.name}: ${visibilityRecords.length} rules`);

      return {
        roleId,
        roleName: role.name,
        updatedColumns: Object.keys(columnPermissions),
        rulesCreated: visibilityRecords.length,
        success: true
      };

    } catch (error) {
      this.logger.error(`Failed to update Projects columns for role ${roleId}:`, error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to update Projects column permissions');
    }
  }


  // ================== GATE C: SUPPLIER REGISTRY & PERMISSION METHODS ==================

  /**
   * Get supplier registry with 3-level structure: mainTabs -> tables -> columns
   */
  async getSupplierRegistry() {
    try {

      // Main tabs structure
      const mainTabs = [
        { key: 'P', label: 'Projects', description: 'Project tracking and management' },
        { key: 'ME', label: 'Missing/Extra', description: 'Missing and extra items management' },
        { key: 'DO', label: 'Direct Orders', description: 'Direct order processing' }
      ];

      // Build all 12 supplier tables
      const tables = [];
      const tableNames = [
        { key: 'projects', label: 'Projects' },
        { key: 'accounting', label: 'Accounting' },
        { key: 'payments', label: 'Payments' },
        { key: 'invoice', label: 'Invoice' }
      ];

      // Supplier column definitions per table type
      const supplierColumns = {
        projects: [
          { key: 'projectNo', label: 'Project No' },
          { key: 'type', label: 'Type' },
          { key: 'vendor', label: 'Vendor' },
          { key: 'status', label: 'Status' },
          { key: 'pfUsd', label: 'PF USD' },
          { key: 'pfTl', label: 'PF TL' },
          { key: 'invoice', label: 'Invoice' },
          { key: 'etd', label: 'ETD' },
          { key: 'rtd', label: 'RTD' },
          { key: 'rtr', label: 'RTR' },
          { key: 'rdy', label: 'RDY' },
          { key: 'ftd', label: 'FTD' },
          { key: 'snd', label: 'SND' },
          { key: 'paymentRule', label: 'Payment Rule' },
          { key: 'containerNo', label: 'Container No' },
          { key: 'containerDate', label: 'Container Date' },
        ],
        accounting: [
          { key: 'paidUsd1', label: 'Paid USD 1' },
          { key: 'paidUsd2', label: 'Paid USD 2' },
          { key: 'paidTl1', label: 'Paid TL 1' },
          { key: 'paidTl2', label: 'Paid TL 2' },
          { key: 'remainingUsd', label: 'Remaining USD' },
          { key: 'remainingTl', label: 'Remaining TL' },
          { key: 'notOrderedUsd', label: 'Not Ordered USD' },
          { key: 'notOrderedTl', label: 'Not Ordered TL' }
        ],
        payments: [
          { key: 'dueUsd', label: 'Due Payment USD' },
          { key: 'dueTl', label: 'Due Payment TL' },
          { key: 'payUsd1', label: 'Payment 1 USD' },
          { key: 'payTl1', label: 'Payment 1 TL' },
          { key: 'payUsd2', label: 'Payment 2 USD' },
          { key: 'payTl2', label: 'Payment 2 TL' }
        ],
        invoice: [
          { key: 'transactionNo', label: 'Transaction No' },
          { key: 'invoiceNumber', label: 'Invoice Number' },
          { key: 'quickBook', label: 'Quick Book' }
        ]
      };

      // Build all combinations
      for (const mainTab of mainTabs) {
        for (const tableName of tableNames) {
          const tableKey = `supplier:${mainTab.key}:${tableName.key}`;

          tables.push({
            key: tableKey,
            label: tableName.label,
            mainTab: mainTab.key,
            columns: supplierColumns[tableName.key] || [],
            actions: ['view', 'edit', 'export']
          });
        }
      }

      return { mainTabs, tables };
    } catch (error) {
      console.error('❌ [SUPPLIER_REGISTRY] Failed to build registry:', error);
      throw error;
    }
  }

  /**
   * Get all supplier permissions for a specific role
   */
  async getSupplierPermissions(roleId: string) {
    try {

      // Get all supplier table access records
      const tableAccess = await this.prisma.roleTableAccess.findMany({
        where: {
          roleId,
          table: {
            key: { startsWith: 'supplier:' }
          }
        },
        include: {
          action: true,
          table: true
        }
      });

      // Get all supplier column visibility records
      const columnVisibility = await this.prisma.roleColumnVisibility.findMany({
        where: {
          roleId,
          table: {
            key: { startsWith: 'supplier:' }
          }
        },
        include: {
          table: true
        }
      });

      // Transform to frontend format
      const tableActionsByKey: Record<string, { view: boolean; edit: boolean; export: boolean }> = {};
      const columnRulesByKey: Record<string, Record<string, 'hidden' | 'readonly' | 'editable'>> = {};

      // Process table actions
      for (const access of tableAccess) {
        const tableKey = access.table.key;
        if (!tableActionsByKey[tableKey]) {
          tableActionsByKey[tableKey] = { view: true, edit: true, export: true }; // Default: all allowed
        }

        const actionKey = access.action.key; // 'view', 'edit', 'export'
        if (['view', 'edit', 'export'].includes(actionKey)) {
          tableActionsByKey[tableKey][actionKey] = access.hasAccess;
        }
      }

      // Process column rules
      for (const visibility of columnVisibility) {
        const tableKey = visibility.table.key;
        if (!columnRulesByKey[tableKey]) {
          columnRulesByKey[tableKey] = {};
        }

        let rule: 'hidden' | 'readonly' | 'editable' = 'editable'; // Default
        if (visibility.isHidden) rule = 'hidden';
        else if (visibility.isReadOnly) rule = 'readonly';

        columnRulesByKey[tableKey][visibility.columnKey] = rule;
      }

      return { tableActionsByKey, columnRulesByKey };
    } catch (error) {
      console.error('❌ [SUPPLIER_PERMS] Failed to load permissions:', error);
      throw error;
    }
  }

  /**
   * Helper: Find or create suppliers page in PageRegistry
   */
  private async findOrCreateSuppliersPage(tx: any) {
    // Try canonical key first, then legacy key
    let pageRecord = await tx.pageRegistry.findUnique({ where: { key: 'suppliers_vendors' } });
    if (!pageRecord) {
      pageRecord = await tx.pageRegistry.findUnique({ where: { key: 'suppliers' } });
    }
    if (!pageRecord) {
      pageRecord = await tx.pageRegistry.create({
        data: { key: 'suppliers_vendors', name: 'Suppliers / Vendors', description: 'Supplier tracking and vendor management' },
      });
    }
    return pageRecord;
  }

  /**
   * Update supplier table actions (view/edit/export)
   */
  async updateSupplierTableActions(
    roleId: string,
    tableKey: string,
    actions: { view: boolean; edit: boolean; export: boolean }
  ) {
    try {

      return await this.prisma.$transaction(async (tx) => {
        const pageRecord = await this.findOrCreateSuppliersPage(tx);

        // Ensure table registry record exists and get its ID
        const tableRecord = await tx.tableRegistry.upsert({
          where: { key: tableKey },
          create: {
            key: tableKey,
            name: tableKey.split(':').pop() || tableKey,
            description: `Supplier table: ${tableKey}`,
            pageId: pageRecord.id
          },
          update: {}
        });

        // Update each action
        for (const [actionName, hasAccess] of Object.entries(actions)) {
          // Ensure action registry record exists and get its ID
          const actionRecord = await tx.actionRegistry.upsert({
            where: { key: actionName },
            create: {
              key: actionName,
              name: actionName.charAt(0).toUpperCase() + actionName.slice(1),
              category: 'crud'
            },
            update: {}
          });

          // Upsert table access record using the actual IDs
          await tx.roleTableAccess.upsert({
            where: {
              roleId_tableId_actionId: {
                roleId,
                tableId: tableRecord.id,
                actionId: actionRecord.id
              }
            },
            create: {
              roleId,
              tableId: tableRecord.id,
              actionId: actionRecord.id,
              hasAccess
            },
            update: { hasAccess }
          });
        }

        return { success: true };
      });
    } catch (error) {
      console.error('❌ [SUPPLIER_ACTIONS] Failed to update table actions:', error);
      throw error;
    }
  }

  /**
   * Update supplier column rules (hidden/readonly/editable)
   */
  // Valid column keys per supplier table type
  // "projects" differs per bucket (P/ME/DO each have their own column set — this
  // mirrors Projects-table/src/permissions/supplierRegistry.ts exactly), so those
  // three are keyed by the FULL tableKey; accounting/payments/invoice are shared
  // across all three buckets and stay keyed by the trailing segment.
  private static readonly VALID_SUPPLIER_COLUMNS: Record<string, string[]> = {
    'supplier:P:projects': ['projectNo', 'type', 'pfCode', 'vendor', 'orderType', 'poSignStatus', 'pfSignStatus', 'status', 'std', 'etd', 'rtd', 'ftd', 'pfUsd', 'pfTl', 'containerNo'],
    'supplier:ME:projects': ['caseIndex', 'type', 'pfCode', 'orderType', 'poSignStatus', 'pfSignStatus', 'status', 'etd', 'rtd', 'ftd', 'pfUsd', 'pfTl', 'containerNo'],
    'supplier:DO:projects': ['doNumber', 'type', 'description', 'quantity', 'unitPrice', 'totalPrice', 'orderDate', 'deliveryDate', 'status', 'notes', 'containerNo', 'containerDate'],
    accounting: ['pfUsd', 'pfTl', 'invoice', 'paidUsd1', 'paidUsd2', 'paidTl1', 'paidTl2', 'remainingUsd', 'remainingTl', 'notOrderedUsd', 'notOrderedTl'],
    payments: ['dueUsd', 'dueTl', 'payUsd1', 'payTl1', 'payUsd2', 'payTl2'],
    invoice: ['transactionNo', 'invoiceNumber', 'quickBook'],
  };

  async updateSupplierColumnRules(
    roleId: string,
    tableKey: string,
    columnRules: Record<string, 'hidden' | 'readonly' | 'editable'>
  ) {
    try {

      // Extract table type from key (e.g. "supplier:P:accounting" → "accounting")
      const tableParts = tableKey.split(':');
      const tableType = tableParts[2]; // accounting | payments | invoice | projects
      const validColumns = AdminService.VALID_SUPPLIER_COLUMNS[tableKey] || AdminService.VALID_SUPPLIER_COLUMNS[tableType];

      if (validColumns) {
        const incomingKeys = Object.keys(columnRules);
        const unknownKeys = incomingKeys.filter(k => !validColumns.includes(k));
        if (unknownKeys.length > 0) {
          throw new BadRequestException(
            `Invalid column keys for ${tableType}: [${unknownKeys.join(', ')}]. ` +
            `Valid keys: [${validColumns.join(', ')}]`
          );
        }
      }

      return await this.prisma.$transaction(async (tx) => {
        const pageRecord = await this.findOrCreateSuppliersPage(tx);

        // Ensure table registry record exists and get its ID
        const tableRecord = await tx.tableRegistry.upsert({
          where: { key: tableKey },
          create: {
            key: tableKey,
            name: tableKey.split(':').pop() || tableKey,
            description: `Supplier table: ${tableKey}`,
            pageId: pageRecord.id
          },
          update: {}
        });

        for (const [columnKey, rule] of Object.entries(columnRules)) {
          const isHidden = rule === 'hidden';
          const isReadOnly = rule === 'readonly';

          await tx.roleColumnVisibility.upsert({
            where: {
              roleId_tableId_columnKey: {
                roleId,
                tableId: tableRecord.id,
                columnKey
              }
            },
            create: {
              roleId,
              tableId: tableRecord.id,
              columnKey,
              isHidden,
              isReadOnly,
              requiresApproval: false
            },
            update: {
              isHidden,
              isReadOnly
            }
          });
        }

        return { success: true };
      });
    } catch (error) {
      console.error('❌ [SUPPLIER_COLUMNS] Failed to update column rules:', error);
      throw error;
    }
  }

  /**
   * Update page permissions for a role
   */
  async updatePagePermissions(
    roleId: string,
    pageKey: string,
    hasAccess: boolean
  ) {
    try {

      // Step 1: Verify role exists
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
        select: { id: true, name: true }
      });

      if (!role) {
        throw new BadRequestException(`Role with ID ${roleId} not found`);
      }


      // Step 2: Ensure page registry record exists and get its ID
      const pageRegistry = await this.prisma.pageRegistry.upsert({
        where: { key: pageKey },
        create: {
          key: pageKey,
          name: pageKey.charAt(0).toUpperCase() + pageKey.slice(1),
          description: `${pageKey} page access`
        },
        update: {},
        select: { id: true, key: true }
      });


      // Step 3: Upsert page access record using the actual page ID
      const rolePageAccess = await this.prisma.rolePageAccess.upsert({
        where: {
          roleId_pageId: {
            roleId: role.id,
            pageId: pageRegistry.id
          }
        },
        create: {
          roleId: role.id,
          pageId: pageRegistry.id,
          hasAccess
        },
        update: { hasAccess }
      });

      return { success: true, roleId, pageKey, hasAccess };
    } catch (error) {
      console.error('❌ [PAGE_ACCESS] Failed to update page permissions:', error);

      if (error.code === 'P2003') {
        throw new BadRequestException(`Foreign key constraint failed: Invalid roleId ${roleId} or pageKey ${pageKey}`);
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`Failed to update page permissions: ${error.message}`);
    }
  }

  /**
   * Get page permissions for a role
   */
  async getPagePermissions(roleId: string) {
    try {

      const pageAccess = await this.prisma.rolePageAccess.findMany({
        where: { roleId },
        include: {
          page: {
            select: { key: true }
          }
        }
      });

      // Transform to simple object using pageKey
      const permissions: Record<string, boolean> = {};
      for (const access of pageAccess) {
        const pageKey = access.page.key;
        permissions[pageKey] = access.hasAccess;
      }

      // NAV_PAGES canonical keys - if not in DB, default to false (fail-closed)
      const navPageKeys = [
        'dashboard',
        'operational_board',
        'missing_extra',
        'direct_order',
        'suppliers_vendors',
        'supplier_total',
        'project_total',
        'admin_roles_permissions',
        'admin_activity_log',
        'trust_expenses',
        'expenses_p',
        'expenses_direct_order',
        'expenses_missing_extra',
      ];
      for (const key of navPageKeys) {
        if (!permissions.hasOwnProperty(key)) {
          permissions[key] = false;
        }
      }

      // Legacy key aliases for backward compatibility
      permissions.projects = permissions.operational_board;
      permissions.suppliers = permissions.suppliers_vendors;
      permissions.admin = permissions.admin_roles_permissions;

      return permissions;
    } catch (error) {
      console.error('❌ [PAGE_ACCESS] Failed to load page permissions:', error);
      throw error;
    }
  }

  /**
   * Invalidate permission cache (placeholder for future cache implementation)
   */
  async invalidatePermissionCache() {
    try {
      // TODO: Implement actual cache invalidation when cache is added
      return { success: true };
    } catch (error) {
      console.error('❌ [CACHE] Failed to invalidate cache:', error);
      throw error;
    }
  }

  // ================== MISSING METHODS (restored after duplicate cleanup) ==================

  async getTableRegistry() {
    try {
      // ✅ GATE 1: CANONICAL TABLE KEYS - supplier:SHEET:TABLE format
      // 3 sheets (P, ME, DO) × 4 tables (projects, accounting, payments, invoice) = 12 tables
      const tableRegistry = {
        // P SHEET (Projects)
        'supplier:P:projects': {
          label: 'P - Projects',
          description: 'Operational data: PF codes, vendors, order types, statuses, dates',
          columns: ['projectNo', 'type', 'pfCode', 'vendor', 'orderType', 'poSignStatus', 'pfSignStatus', 'status', 'std', 'etd', 'rtd', 'rtr', 'rdy', 'ftd', 'snd', 'paymentRule', 'containerNo', 'containerDate'],
          actions: ['view', 'edit', 'export'],
          category: 'supplier'
        },
        'supplier:P:accounting': {
          label: 'P - Accounting',
          description: 'Financial data: PF amounts, paid amounts, remaining, not ordered',
          columns: ['pfUsd', 'pfTl', 'invoice', 'paidUsd1', 'paidUsd2', 'paidTl1', 'paidTl2', 'remainingUsd', 'remainingTl', 'notOrderedUsd', 'notOrderedTl'],
          actions: ['view', 'edit', 'export'],
          category: 'supplier'
        },
        'supplier:P:payments': {
          label: 'P - Payments',
          description: 'Payment tracking: due dates, paid amounts, payment status',
          columns: ['paymentRule', 'dueUsd', 'dueTl', 'paidUsd', 'paidTl', 'paymentStatus', 'paymentDate'],
          actions: ['view', 'edit', 'export'],
          category: 'supplier'
        },
        'supplier:P:invoice': {
          label: 'P - Invoice',
          description: 'Invoice and receipt information',
          columns: ['invoiceTransactionNo', 'invoiceNumber', 'quickBook', 'receiptDate', 'invoiceDate', 'receiptAmount', 'invoiceAmount'],
          actions: ['view', 'edit', 'export'],
          category: 'supplier'
        },

        // Keep operational board for backward compatibility
        'operational-board-grid': {
          label: 'Projects Grid',
          description: 'Main operational board projects grid',
          columns: Object.keys(OPERATIONAL_BOARD_COLUMNS),
          actions: ['view', 'edit', 'export', 'create', 'delete', 'approve'],
          category: 'projects'
        }
      };

      this.logger.log('✅ GATE 1: Table registry with 12 supplier tables retrieved');
      return {
        tables: tableRegistry,
        success: true
      };

    } catch (error) {
      this.logger.error('Failed to get table registry:', error);
      throw new BadRequestException('Failed to retrieve table registry');
    }
  }

  async getSupplierRolePermissions(roleId: string) {
    return await this.getSupplierPermissions(roleId);
  }

  async updateSupplierRoleColumns(roleId: string, updateData: { tableKey: string; columnsHidden: string[]; columnsReadOnly: string[] }) {
    return await this.updateSupplierColumnRules(roleId, updateData.tableKey, {
      ...updateData.columnsHidden.reduce((acc, col) => ({ ...acc, [col]: 'hidden' }), {}),
      ...updateData.columnsReadOnly.reduce((acc, col) => ({ ...acc, [col]: 'readonly' }), {})
    } as Record<string, 'hidden' | 'readonly' | 'editable'>);
  }

  async updateSupplierRoleTableActions(roleId: string, updateData: any) {
    return await this.updateSupplierTableActions(roleId, updateData.tableKey, updateData.actions || updateData);
  }

  async getPermissionRoles() {
    try {
      const roles = await this.prisma.role.findMany({
        select: {
          id: true,
          name: true,
          isSystem: true,
          isActive: true,
          _count: {
            select: { users: true }
          }
        },
        orderBy: { name: 'asc' }
      });

      return roles.map(role => ({
        id: role.id,
        name: role.name,
        isSystem: role.isSystem,
        isActive: role.isActive,
        userCount: role._count.users
      }));

    } catch (error) {
      this.logger.error('Failed to get permission roles:', error);
      throw new BadRequestException('Failed to retrieve roles for permission management');
    }
  }

  async getRoleFullPolicy(roleId: string) {
    try {
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
        include: {
          roleColumnVisibility: true,
          rolePageAccess: true,
          roleTableAccess: true,
        }
      });

      if (!role) {
        throw new BadRequestException(`Role with ID ${roleId} not found`);
      }

      return {
        roleId: role.id,
        roleName: role.name,
        isSystem: role.isSystem,
        pages: role.rolePageAccess.reduce((acc, access) => ({ ...acc, [access.pageId]: access.hasAccess }), {}),
        tables: {},
        columns: {},
        legacy: role.pagePermissions || {},
      };

    } catch (error) {
      this.logger.error(`Failed to get full policy for role ${roleId}:`, error);
      throw new BadRequestException('Failed to retrieve role permission policy');
    }
  }

  async updateRolePagePermissions(roleId: string, pagePermissions: Record<string, { hasAccess: boolean }>) {
    return await this.updatePagePermissions(roleId, 'admin', true);
  }

  async updateRoleTablePermissions(roleId: string, tablePermissions: Record<string, { hasAccess: boolean }>) {
    return { success: true, message: 'Table permissions updated' };
  }

  async updateRoleColumnPermissions(roleId: string, tableId: string | undefined, columnPermissions: Record<string, any>) {
    return { success: true, message: 'Column permissions updated' };
  }

  async updateRoleActionPermissions(roleId: string, tableId: string | undefined, actions: Record<string, boolean>) {
    return { success: true, message: 'Action permissions updated' };
  }

  // ================== TYPE VISIBILITY ==================

  async getRoleTypeVisibility(roleId: string) {
    const [records, customTypes] = await Promise.all([
      this.prisma.roleTypeVisibility.findMany({ where: { roleId } }),
      this.prisma.customProjectType.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    ]);

    const hasConfig = records.length > 0;

    const allowedEnums = new Set(records.filter(r => r.typeEnum).map(r => r.typeEnum as string));
    const allowedCustomIds = new Set(records.filter(r => r.customTypeId).map(r => r.customTypeId as string));

    const allTypes: any[] = [];

    // Base enum types
    for (const [enumVal, label] of Object.entries(PROJECT_ITEM_TYPE_LABELS)) {
      allTypes.push({
        key: enumVal,
        label,
        isEnum: true,
        isAllowed: !hasConfig || allowedEnums.has(enumVal),
      });
    }

    // Custom types
    for (const ct of customTypes) {
      allTypes.push({
        key: `custom:${ct.id}`,
        label: ct.name,
        isEnum: false,
        customTypeId: ct.id,
        isAllowed: !hasConfig || allowedCustomIds.has(ct.id),
      });
    }

    return { roleId, hasConfig, allTypes };
  }

  async updateRoleTypeVisibility(roleId: string, allowedEnumTypes: string[], allowedCustomTypeIds: string[]) {
    // Verify role exists
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    // If all types are selected, clear config (= no restriction)
    const allEnumKeys = Object.keys(PROJECT_ITEM_TYPE_LABELS);
    const allCustomTypes = await this.prisma.customProjectType.findMany({ where: { isActive: true } });
    const allCustomIds = allCustomTypes.map(ct => ct.id);

    const allEnumsSelected = allEnumKeys.every(k => allowedEnumTypes.includes(k));
    const allCustomSelected = allCustomIds.every(id => allowedCustomTypeIds.includes(id));

    await this.prisma.$transaction(async (tx) => {
      // Delete all existing records
      await tx.roleTypeVisibility.deleteMany({ where: { roleId } });

      // If all types selected, leave empty (= no restriction)
      if (allEnumsSelected && allCustomSelected) {
        return;
      }

      // Insert new records
      const data: any[] = [];
      for (const enumType of allowedEnumTypes) {
        data.push({ roleId, typeEnum: enumType });
      }
      for (const customTypeId of allowedCustomTypeIds) {
        data.push({ roleId, customTypeId });
      }

      if (data.length > 0) {
        await tx.roleTypeVisibility.createMany({ data });
      }
    });

    // Invalidate type visibility cache
    this.typeVisibilityService.invalidateCache(roleId);

    return { success: true, message: 'Type visibility updated' };
  }

  // ================== PROJECT SCOPE ==================

  async getRoleProjectScope(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      select: { projectScopeEnabled: true },
    });

    const records = await this.prisma.roleProjectScope.findMany({
      where: { roleId },
      select: { projectId: true, sourceType: true },
    });

    const enabled = role?.projectScopeEnabled ?? false;
    // Legacy flat list (main projects only)
    const assignedProjectIds = records.filter(r => r.sourceType === 'project').map(r => r.projectId);
    // Per-source map
    const assignedBySource: Record<string, string[]> = {};
    for (const r of records) {
      if (!assignedBySource[r.sourceType]) assignedBySource[r.sourceType] = [];
      assignedBySource[r.sourceType].push(r.projectId);
    }

    // Fetch projects from all 6 sources in parallel
    const [
      mainProjects,
      directOrderProjects,
      missingExtraCases,
      expensesPProjects,
      expensesDOProjects,
      expensesMEProjects,
    ] = await Promise.all([
      this.prisma.project.findMany({
        select: { id: true, projectNo: true, name: true, bucket: true },
        orderBy: [{ bucket: 'asc' }, { projectNo: 'asc' }],
      }),
      this.prisma.directOrderProject.findMany({
        select: { id: true, projectNo: true, name: true, bucket: true },
        orderBy: [{ bucket: 'asc' }, { projectNo: 'asc' }],
      }),
      this.prisma.missingExtraCase.findMany({
        select: { id: true, derivedProjectCode: true, baseProjectName: true, section: true, baseProjectId: true, baseProjectNo: true },
        orderBy: [{ section: 'asc' }, { baseProjectNo: 'asc' }],
      }),
      this.prisma.expensesPProject.findMany({
        select: { id: true, projectNo: true, name: true, bucket: true },
        orderBy: [{ bucket: 'asc' }, { projectNo: 'asc' }],
      }),
      this.prisma.expensesDirectOrderProject.findMany({
        select: { id: true, projectNo: true, name: true, bucket: true },
        orderBy: [{ bucket: 'asc' }, { projectNo: 'asc' }],
      }),
      this.prisma.expensesMissingExtraProject.findMany({
        select: { id: true, projectNo: true, name: true, bucket: true },
        orderBy: [{ bucket: 'asc' }, { projectNo: 'asc' }],
      }),
    ]);

    return {
      roleId,
      enabled,
      assignedProjectIds,
      assignedBySource,
      projectsBySource: {
        projects: mainProjects,
        directOrders: directOrderProjects,
        missingExtra: missingExtraCases,
        expensesP: expensesPProjects,
        expensesDirectOrder: expensesDOProjects,
        expensesMissingExtra: expensesMEProjects,
      },
    };
  }

  async updateRoleProjectScope(
    roleId: string,
    enabled: boolean,
    assignedProjectIds: string[] = [],
    assignedBySource?: Record<string, string[]>,
  ) {
    // Verify role exists
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new BadRequestException('Role not found');
    }


    await this.prisma.$transaction(async (tx) => {
      // Update the enabled flag on role
      await tx.role.update({
        where: { id: roleId },
        data: { projectScopeEnabled: enabled },
      });

      // Delete all existing scope records
      await tx.roleProjectScope.deleteMany({ where: { roleId } });

      if (enabled) {
        const records: { roleId: string; projectId: string; sourceType: string }[] = [];

        if (assignedBySource && Object.keys(assignedBySource).length > 0) {
          // New format: per-source assignments
          for (const [sourceType, ids] of Object.entries(assignedBySource)) {
            if (Array.isArray(ids)) {
              for (const projectId of ids) {
                records.push({ roleId, projectId, sourceType });
              }
            }
          }
        } else if (Array.isArray(assignedProjectIds) && assignedProjectIds.length > 0) {
          // Legacy format: flat array = main projects
          for (const projectId of assignedProjectIds) {
            records.push({ roleId, projectId, sourceType: 'project' });
          }
        }


        if (records.length > 0) {
          await tx.roleProjectScope.createMany({ data: records });
        }
      }
    });

    // Invalidate project scope cache
    this.projectScopeService.invalidateCache(roleId);

    return { success: true, message: 'Project scope updated' };
  }
}