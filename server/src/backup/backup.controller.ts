import {
  Controller, Get, Post, Param, Body, Res, NotFoundException, UseGuards,
  UseInterceptors, UploadedFile, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { BackupService } from './backup.service';
import { RestoreService } from './restore.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('backups')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(
    private readonly backupService: BackupService,
    private readonly restoreService: RestoreService,
  ) {}

  /** GET /api/backups — list backup dates */
  @Get()
  async listDates() {
    return { dates: await this.backupService.listBackupDates() };
  }

  /** GET /api/backups/trigger — manually trigger backup (dev mode) */
  @Get('trigger')
  async triggerBackup() {
    const dir = await this.backupService.runFullBackup();
    return { message: 'Backup completed', directory: dir };
  }

  /** POST /api/backups/restore/upload — restore from uploaded Excel file */
  @Post('restore/upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }))
  async restoreFromUpload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { fileType: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    if (!body.fileType) {
      throw new BadRequestException('fileType is required');
    }
    return this.restoreService.restoreFromUpload(file.buffer, body.fileType);
  }

  /** POST /api/backups/restore/:date — restore from server backup */
  @Post('restore/:date')
  async restoreFromBackup(
    @Param('date') date: string,
    @Body() body: { files?: string[] },
  ) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    return this.restoreService.restoreFromServerBackup(date, body.files);
  }

  /** GET /api/backups/:date — list files for a date */
  @Get(':date')
  async listFiles(@Param('date') date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }
    const files = await this.backupService.listBackupFiles(date);
    if (files.length === 0) {
      throw new NotFoundException(`No backup found for ${date}`);
    }
    return { date, files };
  }

  /** GET /api/backups/:date/:filename — download a backup file */
  @Get(':date/:filename')
  async downloadFile(
    @Param('date') date: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const data = await this.backupService.readBackupFile(date, filename);
    if (!data) {
      throw new NotFoundException('File not found');
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(data);
  }
}
