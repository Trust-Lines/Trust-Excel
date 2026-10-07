import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { DropboxService } from './dropbox.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dropbox')
@UseGuards(JwtAuthGuard)
export class DropboxController {
  constructor(private readonly dropboxService: DropboxService) {}

  // Legacy test
  @Post('test')
  async test() {
    return this.dropboxService.testConnection();
  }

  // Step 1 — connect & save token
  @Post('connect')
  async connect(@Body() body: { token?: string }) {
    return this.dropboxService.connectWithToken(body.token ?? '');
  }

  // Step 2 — list folders at a given path
  @Get('folders')
  async listFolders(@Query('path') path: string = '/') {
    const folders = await this.dropboxService.listFolders(path);
    return { folders };
  }

  // Step 2D/2E — create a single folder
  @Post('create-folder')
  async createFolder(@Body() body: { path: string }) {
    return this.dropboxService.createSingleFolder(body.path);
  }

  // Step 2F+2G — create full project structure + V0
  @Post('create-project')
  async createProject(@Body() body: { projectPath: string }) {
    return this.dropboxService.createProjectStructure(body.projectPath);
  }

  // Step 3 — upload test file
  @Post('upload-test')
  async uploadTest(@Body() body: { path: string }) {
    return this.dropboxService.uploadTest(body.path);
  }

  // Step 2H — save target path
  @Post('save-folder')
  async saveFolder(@Body() body: { folder: string }) {
    await this.dropboxService.saveTargetPath(body.folder);
    return { success: true, folder: body.folder };
  }

  // Config — get saved path + hasToken flag
  @Get('config')
  async getConfig() {
    return this.dropboxService.getConfig();
  }

  // V2 flow — create project with updated folder structure
  @Post('create-project-v2')
  async createProjectV2(@Body() body: { projectPath: string }) {
    return this.dropboxService.createProjectStructureV2(body.projectPath);
  }

  // V2 flow — save target path and upload test file
  @Post('save-env-path')
  async saveEnvPath(@Body() body: { path: string }) {
    return this.dropboxService.savePathAndUploadTest(body.path);
  }

  // Get temporary download link for a Dropbox file path
  @Get('temporary-link')
  async getTemporaryLink(@Query('path') path: string) {
    const link = await this.dropboxService.getTemporaryLink(path);
    return { link };
  }
}
