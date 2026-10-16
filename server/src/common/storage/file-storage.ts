import * as fs from 'fs';
import * as path from 'path';

/**
 * Minimal file store: a private Supabase Storage bucket when SUPABASE_URL +
 * SUPABASE_SECRET_KEY are set (required on Vercel — read-only file system),
 * otherwise ./uploads/<bucket>/ on disk for local development.
 */
export class FileStorage {
  private readonly baseUrl: string | null;
  private readonly secretKey: string | null;
  private readonly localRoot: string;
  private bucketReady: Promise<void> | null = null;

  constructor(private readonly bucket: string) {
    const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
    this.secretKey = process.env.SUPABASE_SECRET_KEY || null;
    this.baseUrl = url && this.secretKey ? `${url}/storage/v1` : null;
    this.localRoot = path.resolve(process.cwd(), 'uploads', bucket);
  }

  private headers(extra: Record<string, string> = {}) {
    return { apikey: this.secretKey!, Authorization: `Bearer ${this.secretKey}`, ...extra };
  }

  private static safeKey(key: string) {
    if (!key || key.includes('..') || key.startsWith('/') || /[\\]/.test(key)) throw new Error('Invalid file key');
    return key;
  }

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
          if (!/already exists|Duplicate/i.test(text)) {
            this.bucketReady = null;
            throw new Error(`Storage bucket create failed (${res.status}): ${text}`);
          }
        }
      })();
    }
    return this.bucketReady;
  }

  async save(key: string, data: Buffer, contentType: string): Promise<void> {
    FileStorage.safeKey(key);
    if (!this.baseUrl) {
      const file = path.join(this.localRoot, key);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, data);
      return;
    }
    await this.ensureBucket();
    const res = await fetch(`${this.baseUrl}/object/${this.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`, {
      method: 'POST',
      headers: this.headers({ 'Content-Type': contentType, 'x-upsert': 'true' }),
      body: data as any,
    });
    if (!res.ok) throw new Error(`Storage upload failed (${res.status}): ${await res.text().catch(() => '')}`);
  }

  async read(key: string): Promise<Buffer | null> {
    FileStorage.safeKey(key);
    if (!this.baseUrl) {
      const file = path.join(this.localRoot, key);
      return fs.existsSync(file) ? fs.readFileSync(file) : null;
    }
    const res = await fetch(`${this.baseUrl}/object/authenticated/${this.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`, {
      headers: this.headers(),
    });
    if (res.status === 400 || res.status === 404) return null;
    if (!res.ok) throw new Error(`Storage download failed (${res.status})`);
    return Buffer.from(await res.arrayBuffer());
  }
}
