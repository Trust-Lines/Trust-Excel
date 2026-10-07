import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, ValidationPipe, UsePipes } from '@nestjs/common';
import { PfGroupsService } from './pf-groups.service';
import { PfGroupTargetDto, ReorderPfGroupMemberDto } from './dto/pf-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// No dedicated page-access permission — grouping is a general Projects-tab
// tool anyone signed in can use, same as the ordinary right-click project menu.
@Controller('pf-groups')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PfGroupsController {
  constructor(private readonly pfGroupsService: PfGroupsService) {}

  @Get()
  list() {
    return this.pfGroupsService.list();
  }

  @Post()
  createGroup(@Body() dto: PfGroupTargetDto, @Request() req: any) {
    return this.pfGroupsService.createGroup(dto, req.user?.userId || req.user?.id);
  }

  @Post(':groupId/members')
  addMember(@Param('groupId') groupId: string, @Body() dto: PfGroupTargetDto, @Request() req: any) {
    return this.pfGroupsService.addMember(groupId, dto, req.user?.userId || req.user?.id);
  }

  @Patch('members/:memberId/reorder')
  reorderMember(@Param('memberId') memberId: string, @Body() dto: ReorderPfGroupMemberDto) {
    return this.pfGroupsService.reorderMember(memberId, dto.direction);
  }

  @Delete('members/:memberId')
  removeMember(@Param('memberId') memberId: string) {
    return this.pfGroupsService.removeMember(memberId);
  }

  @Delete(':groupId')
  deleteGroup(@Param('groupId') groupId: string) {
    return this.pfGroupsService.deleteGroup(groupId);
  }
}
