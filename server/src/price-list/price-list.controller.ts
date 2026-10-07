import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PriceListService } from './price-list.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('price-list')
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Get('projects')
  getProjects() {
    return this.priceListService.getProjects();
  }

  @Get('lookups')
  getLookups(@Query('field') field?: string) {
    return this.priceListService.getLookups(field);
  }

  @Post('lookups')
  upsertLookup(@Body() body: { field: string; value: string; sortOrder?: number }) {
    return this.priceListService.upsertLookup(body.field, body.value, body.sortOrder);
  }

  @Post('lookups/batch')
  batchUpsertLookups(@Body() body: { items: Array<{ field: string; value: string; sortOrder?: number }> }) {
    return this.priceListService.batchUpsertLookups(body.items ?? []);
  }

  @Post('lookups/set')
  setExactLookup(@Body() body: { field: string; value: string }) {
    return this.priceListService.setExactLookup(body.field, body.value);
  }

  @Get('entries')
  getEntries(@Query('projectId') projectId?: string) {
    return this.priceListService.getEntries(projectId);
  }

  @Get('entries/:id')
  getEntry(@Param('id') id: string) {
    return this.priceListService.getEntry(id);
  }

  @Post('entries')
  createEntry(@Body() body: { projectId: string; type: string; formData: any }, @Request() req: any) {
    return this.priceListService.createEntry({ ...body, createdByUserId: req.user?.id });
  }

  @Put('entries/:id')
  updateEntry(@Param('id') id: string, @Body() body: { formData: any }) {
    return this.priceListService.updateEntry(id, body);
  }

  @Delete('entries/:id')
  deleteEntry(@Param('id') id: string) {
    return this.priceListService.deleteEntry(id);
  }

  @Post('save-and-generate')
  saveAndGenerate(
    @Body() body: { projectId: string; type: string; formData: any; entryId?: string; mode?: 'new_version' | 'same_version' },
    @Request() req: any,
  ) {
    return this.priceListService.saveAndGenerate({ ...body, createdByUserId: req.user?.id });
  }

  // FIX 5: Approval endpoints
  @Get('approvals/pending')
  getPendingApprovals(@Request() req: any) {
    return this.priceListService.getPendingApprovals(req.user?.id);
  }

  @Post('approvals/:id/approve')
  approveApproval(@Param('id') id: string, @Request() req: any) {
    return this.priceListService.approveApproval(id, req.user?.id);
  }

  @Post('approvals/:id/sign')
  signApproval(@Param('id') id: string, @Body() body: { signatureData: string }, @Request() req: any) {
    return this.priceListService.signApproval(id, req.user?.id, body.signatureData);
  }

  @Post('entries/:entryId/sign-role')
  signEntryRole(@Param('entryId') entryId: string, @Body() body: { role: string; signatureData: string }, @Request() req: any) {
    return this.priceListService.signEntryRole(entryId, body.role, req.user?.id, body.signatureData);
  }

  @Post('approvals/:id/reject')
  rejectApproval(@Param('id') id: string, @Body() body: { note?: string }, @Request() req: any) {
    return this.priceListService.rejectApproval(id, req.user?.id, body.note);
  }
}
