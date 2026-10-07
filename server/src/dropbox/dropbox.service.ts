import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as https from 'https';
import * as fs from 'fs';
import * as nodePath from 'path';

const PROJECT_STRUCTURE = [
  '1-Finalization',
  '1-Finalization/0-Project Closure Meeting',
  '1-Finalization/1-Client Pre-Meet',
  '1-Finalization/2-Project info',
  '1-Finalization/3-First Project Meeting',
  '1-Finalization/4-Branding',
  '1-Finalization/5-Plan Layout',
  '1-Finalization/6-Design Proposal',
  '2-Construction Document',
  '2-Construction Document/0-Contractor Meeting',
  '2-Construction Document/1-Technical meeting',
  '2-Construction Document/2-Internal PM Meeting',
  '2-Construction Document/3-Construction Drawings',
  '2-Construction Document/4-Cut Sheets',
  '3-Production & Delivery',
  '3-Production & Delivery/0-Missing-Extra',
  '3-Production & Delivery/Ceiling',
  '3-Production & Delivery/Image',
  '3-Production & Delivery/Millwork',
  '3-Production & Delivery/Millwork/V0',
  '3-Production & Delivery/Shelving',
];

@Injectable()
export class DropboxService implements OnModuleInit {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DropboxConfig" (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  // ── Token cache ───────────────────────────────────────────────────────────
  // Dropbox short-lived tokens are valid for ~4 hours. Cache for 50 min to be safe.
  // pendingTokenRefresh deduplicates concurrent calls so parallel requests share
  // one in-flight refresh instead of hammering the OAuth endpoint 6 times.

  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;
  private pendingTokenRefresh: Promise<string> | null = null;

  private async resolveToken(): Promise<string> {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }
    if (!this.pendingTokenRefresh) {
      this.pendingTokenRefresh = this.fetchFreshToken().finally(() => {
        this.pendingTokenRefresh = null;
      });
    }
    return this.pendingTokenRefresh;
  }

  private async fetchFreshToken(): Promise<string> {
    const appKey = this.config.get<string>('DROPBOX_APP_KEY');
    const appSecret = this.config.get<string>('DROPBOX_APP_SECRET');
    const refreshToken = this.config.get<string>('DROPBOX_REFRESH_TOKEN');
    if (!appKey || !appSecret || !refreshToken) {
      throw new Error('Dropbox OAuth2 credentials missing from environment (DROPBOX_APP_KEY, DROPBOX_APP_SECRET, DROPBOX_REFRESH_TOKEN).');
    }
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: appKey,
      client_secret: appSecret,
    }).toString();
    const result = await new Promise<any>((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.dropbox.com',
          path: '/oauth2/token',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode && res.statusCode >= 400)
                reject(new Error(parsed?.error_description ?? parsed?.error ?? `HTTP ${res.statusCode}`));
              else resolve(parsed);
            } catch {
              reject(new Error(`Non-JSON response from token endpoint: ${data}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.write(body);
      req.end();
    });
    if (!result?.access_token) throw new Error('No access_token returned from Dropbox token endpoint.');
    this.cachedToken = result.access_token as string;
    this.tokenExpiresAt = Date.now() + 50 * 60 * 1000; // 50 minutes
    return this.cachedToken;
  }

  private async saveConfig(key: string, value: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "DropboxConfig" (key, value, "updatedAt") VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, "updatedAt" = NOW()`,
      key,
      value,
    );
  }

  // ── HTTP helpers ─────────────────────────────────────────────────────────

  private async callDropboxJson(endpoint: string, body: unknown, token: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify(body);
      const req = https.request(
        {
          hostname: 'api.dropboxapi.com',
          path: `/2/${endpoint}`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode && res.statusCode >= 400)
                reject(new Error(parsed?.error_summary ?? `HTTP ${res.statusCode}`));
              else resolve(parsed);
            } catch {
              reject(new Error(`Non-JSON response: ${data}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  private async uploadFileHttp(dropboxPath: string, content: Buffer, token: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'content.dropboxapi.com',
          path: '/2/files/upload',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({ path: dropboxPath, mode: 'overwrite', autorename: false }),
            'Content-Length': content.length,
          },
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(data);
              if (res.statusCode && res.statusCode >= 400)
                reject(new Error(parsed?.error_summary ?? `HTTP ${res.statusCode}`));
              else resolve(parsed);
            } catch {
              reject(new Error(`Non-JSON response: ${data}`));
            }
          });
        },
      );
      req.on('error', reject);
      req.write(content);
      req.end();
    });
  }

  // ── Folder helpers ───────────────────────────────────────────────────────

  private async mkdirSafe(path: string, token: string): Promise<boolean> {
    try {
      await this.callDropboxJson('files/create_folder_v2', { path, autorename: false }, token);
      return true;
    } catch (err: any) {
      if (err?.message?.includes('path/conflict')) return false;
      throw err;
    }
  }

  // Creates every segment of a path, skipping ones that already exist
  private async ensurePath(path: string, token: string): Promise<void> {
    const segments = path.split('/').filter(Boolean);
    let current = '';
    for (const seg of segments) {
      current += '/' + seg;
      await this.mkdirSafe(current, token);
    }
  }

  // Creates many folders in a single Dropbox API call (avoids too_many_write_operations).
  // path/conflict entries (folder already exists) are silently ignored.
  private async batchMkdir(paths: string[], token: string): Promise<void> {
    if (paths.length === 0) return;
    const result = await this.callDropboxJson(
      'files/create_folder_batch',
      { paths, autorename: false },
      token,
    ) as any;

    if (result?.['.tag'] === 'async_job_id') {
      let status: any;
      do {
        await new Promise(r => setTimeout(r, 400));
        status = await this.callDropboxJson(
          'files/create_folder_batch/check',
          { async_job_id: result.async_job_id },
          token,
        );
      } while (status?.['.tag'] === 'in_progress');
    }
    // Individual path/conflict failures inside the batch result are expected and ignored.
  }

  // ── Public API ───────────────────────────────────────────────────────────

  async connectWithToken(_token?: string): Promise<{ name: string; email: string; accountId: string }> {
    const token = await this.resolveToken();
    const result = (await this.callDropboxJson('users/get_current_account', null, token)) as any;
    return {
      name: result.name?.display_name ?? '',
      email: result.email ?? '',
      accountId: result.account_id ?? '',
    };
  }

  async listFolders(path: string): Promise<{ name: string; path: string }[]> {
    const token = await this.resolveToken();
    const dropboxPath = path === '/' || path === '' ? '' : path;
    let result: any;
    try {
      result = await this.callDropboxJson(
        'files/list_folder',
        {
          path: dropboxPath,
          recursive: false,
          include_non_downloadable_files: false,
          include_media_info: false,
          include_deleted: false,
        },
        token,
      );
    } catch (err: any) {
      if (err?.message?.includes('path/not_found') && dropboxPath) {
        // Auto-create the missing path and return empty list
        await this.ensurePath(dropboxPath, token);
        return [];
      }
      throw err;
    }
    return (result.entries ?? [])
      .filter((e: any) => e['.tag'] === 'folder')
      .map((e: any) => ({ name: e.name, path: e.path_display }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name));
  }

  async createSingleFolder(path: string): Promise<{ path: string; created: boolean }> {
    const token = await this.resolveToken();
    const created = await this.mkdirSafe(path, token);
    return { path, created };
  }

  async createProjectStructure(
    projectPath: string,
  ): Promise<{ targetPath: string; created: number; skipped: number }> {
    const token = await this.resolveToken();
    let created = 0;
    let skipped = 0;
    for (const sub of PROJECT_STRUCTURE) {
      const ok = await this.mkdirSafe(`${projectPath}/${sub}`, token);
      ok ? created++ : skipped++;
    }
    const targetPath = `${projectPath}/3-Production & Delivery/Millwork/V0`;
    return { targetPath, created, skipped };
  }

  async uploadTest(path: string): Promise<{ path: string; size: number }> {
    const token = await this.resolveToken();
    const content = Buffer.from(
      `Trust System — Production Form Test Upload\nZaman: ${new Date().toISOString()}\nHedef: ${path}\n`,
      'utf8',
    );
    const filePath = path.endsWith('/') ? `${path}upload-test.txt` : `${path}/upload-test.txt`;
    const result = (await this.uploadFileHttp(filePath, content, token)) as any;
    return { path: result.path_display ?? filePath, size: result.size ?? content.length };
  }

  async saveTargetPath(path: string): Promise<void> {
    await this.saveConfig('target_folder', path);
  }

  async getConfig(): Promise<{ targetFolder: string | null; hasToken: boolean }> {
    const hasToken =
      !!this.config.get<string>('DROPBOX_APP_KEY') &&
      !!this.config.get<string>('DROPBOX_APP_SECRET') &&
      !!this.config.get<string>('DROPBOX_REFRESH_TOKEN');
    try {
      const rows = await this.prisma.$queryRawUnsafe<{ key: string; value: string }[]>(
        `SELECT key, value FROM "DropboxConfig" WHERE key = 'target_folder'`,
      );
      const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
      return { targetFolder: map['target_folder'] ?? null, hasToken };
    } catch {
      return { targetFolder: null, hasToken };
    }
  }

  async createProjectStructureV2(projectPath: string): Promise<{ success: boolean; created: string[] }> {
    const NEW_STRUCTURE = [
      '1-Finalization',
      '1-Finalization/0-Project Closure Meeting  Tlines',
      '1-Finalization/1-Client Pre-Meet Tlines',
      '1-Finalization/2-Project info',
      '1-Finalization/3-First Project Meeting Tlines  Trust lines',
      '1-Finalization/4-Branding',
      '1-Finalization/5-Plan Layout',
      '1-Finalization/6-Design Proposal',
      '2-Construction Document',
      '2-Construction Document/0-Contractor Meeting',
      '2-Construction Document/1-Technical meeting Trust-Tlines',
      '2-Construction Document/2-Internal PM Meeting',
      '2-Construction Document/3-Construction Drawings',
      '2-Construction Document/4-Cut Sheets',
      '3-Production & Delivery',
      '3-Production & Delivery/0-Missing-Extra',
      '3-Production & Delivery/Ceiling',
      '3-Production & Delivery/Image',
      '3-Production & Delivery/Millwork',
      '3-Production & Delivery/Shelving',
    ];
    const token = await this.resolveToken();
    const paths = NEW_STRUCTURE.map(sub => `${projectPath}/${sub}`);
    await this.batchMkdir(paths, token);
    return { success: true, created: paths };
  }

  async savePathAndUploadTest(targetPath: string): Promise<{ success: boolean; uploadedTo: string }> {
    // Informational only (never read back). Serverless file systems are
    // read-only outside the temp dir, so write there and never fail on it.
    try {
      const configPath = nodePath.join(require('os').tmpdir(), 'dropbox-config.json');
      fs.writeFileSync(
        configPath,
        JSON.stringify({ targetPath, savedAt: new Date().toISOString() }, null, 2),
        'utf8',
      );
    } catch { /* ignore */ }
    const token = await this.resolveToken();
    const timestamp = Date.now();
    const date = new Date().toISOString();
    const fileName = `test-${timestamp}.txt`;
    const content = Buffer.from(
      `Gösteri Woodworks - Test\nPath: ${targetPath}\nDate: ${date}`,
      'utf8',
    );
    const dropboxPath = targetPath.endsWith('/')
      ? `${targetPath}${fileName}`
      : `${targetPath}/${fileName}`;
    const result = (await this.uploadFileHttp(dropboxPath, content, token)) as any;
    return { success: true, uploadedTo: result.path_display ?? dropboxPath };
  }

  async ensureFolderPath(path: string): Promise<void> {
    const token = await this.resolveToken();
    await this.ensurePath(path, token);
  }

  async createFolderBatch(paths: string[]): Promise<void> {
    const token = await this.resolveToken();
    await this.batchMkdir(paths, token);
  }

  async uploadBuffer(dropboxPath: string, buffer: Buffer): Promise<string> {
    const token = await this.resolveToken();
    const result = (await this.uploadFileHttp(dropboxPath, buffer, token)) as any;
    return result.path_display ?? dropboxPath;
  }

  async getTemporaryLink(path: string): Promise<string> {
    const token = await this.resolveToken();
    const result = (await this.callDropboxJson('files/get_temporary_link', { path }, token)) as any;
    return result.link as string;
  }

  // Legacy
  async testConnection() {
    const token = await this.resolveToken();
    const account = await this.callDropboxJson('users/get_current_account', null, token);
    return { account };
  }
}
