import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Where backup .xlsx files live.
 *
 * - Supabase Storage (private bucket, default "backups") when SUPABASE_URL and
 *   SUPABASE_SECRET_KEY are set — required on Vercel, whose file system is
 *   read-only and wiped between invocations.
 * - Local `./backups/<date>/<file>.xlsx` otherwise (local development).
 *
 * Layout is the same in both: `<YYYY-MM-DD>/<Name>.xlsx`.
 */
@Injectable()
export class BackupStorage {
  private readonly logger = new Logger(BackupStorage.name);
  private readonly baseUrl: string | null;
  private readonly secretKey: string | null;
  private readonly bucket: string;
  private readonly localRoot = path.resolve(process.cwd(), 'backups');
  private bucketReady: Promise<void> | null = null;

  constructor(config: ConfigService) {
    const url = (config.get<string>('SUPABASE_URL') || '').replace(/\/+$/, '');
    this.secretKey = config.get<string>('SUPABASE_SECRET_KEY') || null;
    this.baseUrl = url && this.secretKey ? `${url}/storage/v1` : null;
    this.bucket = config.get<string>('BACKUP_BUCKET') || 'backups';
  }

  get remote(): boolean {
    return !!this.baseUrl;
  }

  private headers(extra: Record<string, string> = {}) {
    return { apikey: this.secretKey!, Authorization: `Bearer ${this.secretKey}`, ...extra };
  }

  private static assertSafe(date: string, filename?: string) {
    if (!DATE_RE.test(date)) throw new Error('Invalid backup date');
    if (filename !== undefined && (/[/\\]/.test(filename) || filename.includes('..') || !filename)) {
      throw new Error('Invalid backup filename');
    }
  }

  /** Create the private bucket on first use (idempotent). */
  private ensureBucket(): Promise<void> {
    if (!this.bucketReady) {
      this.bucketReady = (async () => {
        const res = await fetch(`${this.baseUrl}/bucket`, {
          method: 'POST',
          headers: this.headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ id: this.bucket, name: this.bucket, public: false }),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          // "already exists" comes back as 400/409 — that's fine
          if (!/already exists|Duplicate/i.test(text)) {
            this.bucketReady = null;
            throw new Error(`Storage bucket create failed (${res.status}): ${text}`);
          }
        }
      })();
    }
    return this.bucketReady;
  }

  private async listRemote(prefix: string): Promise<{ name: string; id: string | null }[]> {
    await this.ensureBucket();
    const res = await fetch(`${this.baseUrl}/object/list/${this.bucket}`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } }),
    });
    if (!res.ok) throw new Error(`Storage list failed (${res.status}): ${await res.text().catch(() => '')}`);
    return res.json();
  }

  async save(date: string, filename: string, data: Buffer): Promise<void> {
    BackupStorage.assertSafe(date, filename);
    if (!this.remote) {
      const dir = path.join(this.localRoot, date);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), data);
      return;
    }
    await this.ensureBucket();
    const res = await fetch(`${this.baseUrl}/object/${this.bucket}/${date}/${encodeURIComponent(filename)}`, {
      method: 'POST',
      headers: this.headers({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'x-upsert': 'true',
      }),
      body: data as any,
    });
    if (!res.ok) throw new Error(`Storage upload failed (${res.status}): ${await res.text().catch(() => '')}`);
  }

  /** Backup dates, newest first. */
  async listDates(): Promise<string[]> {
    let names: string[];
    if (!this.remote) {
      if (!fs.existsSync(this.localRoot)) return [];
      names = fs.readdirSync(this.localRoot);
    } else {
      // folders are returned with id === null
      names = (await this.listRemote('')).filter((e) => e.id === null).map((e) => e.name);
    }
    return names.filter((n) => DATE_RE.test(n)).sort().reverse();
  }

  async listFiles(date: string): Promise<string[]> {
    BackupStorage.assertSafe(date);
    let names: string[];
    if (!this.remote) {
      const dir = path.join(this.localRoot, date);
      if (!fs.existsSync(dir)) return [];
      names = fs.readdirSync(dir);
    } else {
      names = (await this.listRemote(`${date}/`)).filter((e) => e.id !== null).map((e) => e.name);
    }
    return names.filter((f) => f.endsWith('.xlsx')).sort();
  }

  /** File contents, or null if it doesn't exist. */
  async read(date: string, filename: string): Promise<Buffer | null> {
    try {
      BackupStorage.assertSafe(date, filename);
    } catch {
      return null;
    }
    if (!this.remote) {
      const file = path.join(this.localRoot, date, filename);
      return fs.existsSync(file) ? fs.readFileSync(file) : null;
    }
    const res = await fetch(`${this.baseUrl}/object/authenticated/${this.bucket}/${date}/${encodeURIComponent(filename)}`, {
      headers: this.headers(),
    });
    if (res.status === 400 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Storage download failed (${res.status}): ${await res.text().catch(() => '')}`);
    return Buffer.from(await res.arrayBuffer());
  }

  async removeDate(date: string): Promise<void> {
    BackupStorage.assertSafe(date);
    if (!this.remote) {
      fs.rmSync(path.join(this.localRoot, date), { recursive: true, force: true });
      return;
    }
    const files = await this.listFiles(date);
    if (files.length === 0) return;
    const res = await fetch(`${this.baseUrl}/object/${this.bucket}`, {
      method: 'DELETE',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefixes: files.map((f) => `${date}/${f}`) }),
    });
    if (!res.ok) throw new Error(`Storage delete failed (${res.status}): ${await res.text().catch(() => '')}`);
  }

  describe(date: string): string {
    return this.remote ? `supabase://${this.bucket}/${date}` : path.join(this.localRoot, date);
  }
}
