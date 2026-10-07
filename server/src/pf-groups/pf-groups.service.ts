import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PfGroupTargetDto, ReorderDirection } from './dto/pf-group.dto';

const PF_TYPE_LABELS: Record<string, string> = {
  MILLWORK: 'Millwork',
  SHELVING: 'Shelving',
  CEILING: 'Ceiling',
  IMAGE: 'Image',
  FURNITURE: 'Furniture',
  DECORATION: 'Decoration',
};

@Injectable()
export class PfGroupsService {
  private readonly logger = new Logger(PfGroupsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  private notify() {
    this.eventsGateway.emitToRooms(['projects', 'dashboard'], 'pf-group:updated', {});
  }

  async list() {
    const groups = await this.prisma.pfGroup.findMany({
      orderBy: { number: 'asc' },
      include: {
        members: {
          orderBy: { rank: 'asc' },
          include: {
            project: { select: { id: true, projectNo: true, name: true, bucket: true, deletedAt: true } },
            customType: { select: { id: true, name: true } },
          },
        },
      },
    });

    return groups
      .map((group) => ({
        id: group.id,
        number: group.number,
        createdAt: group.createdAt,
        members: group.members
          .filter((m) => !m.project.deletedAt)
          .map((m) => ({
            id: m.id,
            groupId: m.groupId,
            rank: m.rank,
            projectId: m.projectId,
            projectNo: m.project.projectNo,
            projectName: m.project.name,
            bucket: m.project.bucket,
            type: m.type,
            customTypeId: m.customTypeId,
            typeLabel: m.customType?.name || PF_TYPE_LABELS[m.type || ''] || m.type || 'Unknown',
          })),
      }))
      .filter((group) => group.members.length > 0);
  }

  private async assertProjectExists(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true, deletedAt: true } });
    if (!project || project.deletedAt) throw new NotFoundException('Project not found');
  }

  /** Creates a brand-new group whose first (and only) member is this target. */
  async createGroup(dto: PfGroupTargetDto, userId?: string) {
    if (!dto.type && !dto.customTypeId) {
      throw new BadRequestException('Either type or customTypeId is required');
    }
    await this.assertProjectExists(dto.projectId);

    const result = await this.prisma.$transaction(async (tx) => {
      const last = await tx.pfGroup.findFirst({ orderBy: { number: 'desc' }, select: { number: true } });
      const group = await tx.pfGroup.create({
        data: { number: (last?.number ?? 0) + 1, createdByUserId: userId ?? null },
      });
      await tx.pfGroupMember.create({
        data: {
          groupId: group.id,
          projectId: dto.projectId,
          type: dto.customTypeId ? null : (dto.type as any),
          customTypeId: dto.customTypeId ?? null,
          rank: 1,
          createdByUserId: userId ?? null,
        },
      });
      return group;
    });

    this.notify();
    return result;
  }

  /** Appends a target as the next-ranked member of an existing group. Idempotent. */
  async addMember(groupId: string, dto: PfGroupTargetDto, userId?: string) {
    if (!dto.type && !dto.customTypeId) {
      throw new BadRequestException('Either type or customTypeId is required');
    }
    const group = await this.prisma.pfGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    await this.assertProjectExists(dto.projectId);

    const existing = await this.prisma.pfGroupMember.findFirst({
      where: {
        groupId,
        projectId: dto.projectId,
        type: dto.customTypeId ? null : (dto.type as any),
        customTypeId: dto.customTypeId ?? null,
      },
    });
    if (existing) {
      this.notify();
      return existing;
    }

    const member = await this.prisma.$transaction(async (tx) => {
      const members = await tx.pfGroupMember.findMany({ where: { groupId }, select: { rank: true } });
      const ranks = members.map((m) => m.rank);
      const maxRank = ranks.length ? Math.max(...ranks) : 0;
      // Join the requested tier if it already exists, or let it open a genuinely
      // new tier right after the last one (the "+ New rank" option asks for
      // exactly maxRank + 1 — that must NOT be treated as invalid just because
      // it doesn't exist YET). Anything else invalid falls back to rank 1.
      const rank = dto.rank && (ranks.includes(dto.rank) || dto.rank === maxRank + 1) ? dto.rank : 1;

      return tx.pfGroupMember.create({
        data: {
          groupId,
          projectId: dto.projectId,
          type: dto.customTypeId ? null : (dto.type as any),
          customTypeId: dto.customTypeId ?? null,
          rank,
          createdByUserId: userId ?? null,
        },
      });
    });

    this.notify();
    return member;
  }

  /** Swaps this member's rank with its immediate neighbour in the same group. */
  /**
   * A group's rank is a PRIORITY TIER, not a per-member slot: several members
   * (different projects, or different types of the same project) can share the
   * same rank — e.g. two entries can both sit at rank 1. Tiers stay contiguous
   * (1..N, no gaps), so "up"/"down" always has a well-defined adjacent tier to
   * join, except moving down from the last tier, which splits off a new one.
   */
  async reorderMember(memberId: string, direction: ReorderDirection) {
    const member = await this.prisma.pfGroupMember.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');

    const groupMembers = await this.prisma.pfGroupMember.findMany({ where: { groupId: member.groupId } });
    const tiers = [...new Set(groupMembers.map((m) => m.rank))].sort((a, b) => a - b);
    const idx = tiers.indexOf(member.rank);

    let newRank: number;
    if (direction === 'up') {
      if (idx <= 0) return { message: 'Already at the top tier' }; // no-op
      newRank = tiers[idx - 1];
    } else {
      // Already the last tier: split off into a brand-new tier right after it.
      newRank = idx === tiers.length - 1 ? member.rank + 1 : tiers[idx + 1];
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.pfGroupMember.update({ where: { id: member.id }, data: { rank: newRank } });
      await this.repackTiers(tx, member.groupId);
    });

    this.notify();
    return { message: 'Reordered' };
  }

  /** Closes any gap left in a group's tier numbering (e.g. a member's old tier is now empty). */
  private async repackTiers(tx: any, groupId: string) {
    const members = await tx.pfGroupMember.findMany({ where: { groupId }, orderBy: { rank: 'asc' } });
    const distinct = ([...new Set(members.map((m: any) => m.rank as number))] as number[]).sort((a, b) => a - b);
    const rankMap = new Map(distinct.map((r, i) => [r, i + 1]));
    await Promise.all(
      members.map((m: any) => {
        const mapped = rankMap.get(m.rank)!;
        return mapped === m.rank ? Promise.resolve() : tx.pfGroupMember.update({ where: { id: m.id }, data: { rank: mapped } });
      }),
    );
  }

  /** Removes one member; if the group is left empty, the group itself is deleted too. */
  async removeMember(memberId: string) {
    const member = await this.prisma.pfGroupMember.findUnique({ where: { id: memberId } });
    if (!member) throw new NotFoundException('Member not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.pfGroupMember.delete({ where: { id: memberId } });

      const remaining = await tx.pfGroupMember.findMany({ where: { groupId: member.groupId } });
      if (remaining.length === 0) {
        await tx.pfGroup.delete({ where: { id: member.groupId } }).catch(() => {});
      } else {
        await this.repackTiers(tx, member.groupId);
      }
    });

    this.notify();
    return { message: 'Removed' };
  }

  async deleteGroup(groupId: string) {
    const group = await this.prisma.pfGroup.findUnique({ where: { id: groupId } });
    if (!group) throw new NotFoundException('Group not found');
    await this.prisma.pfGroup.delete({ where: { id: groupId } });
    this.notify();
    return { message: 'Group deleted' };
  }
}
