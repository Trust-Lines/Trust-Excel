import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../services/access-control.service';

/**
 * Projects Permission Examples
 * Demonstrates V2 permission system ONLY for Projects table
 * FEATURE FLAG AWARE: Only active when PERMISSIONS_V2_MODE != 'off'
 */
@Injectable()
export class ProjectsPermissionsExample {
  private readonly logger = new Logger(ProjectsPermissionsExample.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControlService: AccessControlService
  ) {}

  /**
   * EXAMPLE: Projects Update with V2 Field Authorization
   * Shows how existing Projects behavior is preserved with V2 overlay
   */
  async updateProjectItemWithV2Example(
    itemId: string,
    updateData: any,
    userId: string
  ) {
    return this.accessControlService.updateProjectItemWithFieldAuthorizationV2(
      userId,
      itemId,
      updateData,
      // Update function - preserves existing Projects logic
      async (id, data) => {
        this.logger.log(`V2 Example: Updating project item ${id} with authorized data`);
        return await this.prisma.projectItem.update({
          where: { id },
          data,
          include: {
            vendor: true,
            orderTypeRef: true,
            customType: true,
          }
        });
      }
    );
  }

  /**
   * EXAMPLE: Get User's Visible Columns for Projects
   * Shows how V2 can filter columns for API responses
   */
  async getProjectVisibleColumnsExample(userId: string) {
    return this.accessControlService.getProjectVisibleColumns(userId);
  }

  /**
   * EXAMPLE: Check if V2 is enabled for Projects
   */
  isV2EnabledForProjects(userId?: string): boolean {
    return this.accessControlService.isV2Enabled('operational-board-grid', userId);
  }
}

/**
 * Example DTOs for Projects V2 integration
 */
export interface ProjectItemUpdateDto {
  type?: string;
  vendorId?: string;
  orderTypeId?: string;
  pfSignStatus?: string;
  poSignStatus?: string;
  status?: string;
  std?: Date;
  etd?: Date;
  rtd?: Date;
  ftd?: Date;
  pfUsd?: number;
  pfTl?: number;
  paymentRule?: string;
  containerNo?: string;
  containerDate?: Date;
}