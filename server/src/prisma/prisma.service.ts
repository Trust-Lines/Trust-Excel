import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const CONNECT_RETRIES = 5;
const QUERY_RETRIES = 3;
const RETRY_BASE_MS = 1000;

/**
 * Prisma messages that indicate the TCP connection was lost and a retry is safe.
 * These appear when Railway's PostgreSQL restarts or closes idle sockets.
 */
const TRANSIENT_PATTERNS = [
  "Server has closed the connection",
  "Can't reach database server",
  "Connection reset",
  "Connection refused",
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "socket timeout",
  "connection timeout",
];

function isTransient(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return TRANSIENT_PATTERNS.some(p => msg.includes(p));
}

// Running as a Vercel Function: many short-lived instances, each must hold at most
// one pooled connection (Supabase's pooler does the real pooling) and no timers.
const IS_SERVERLESS = !!process.env.VERCEL;

function buildDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL ?? '';
  try {
    const url = new URL(raw);
    // Prisma connection-pool defaults — override only if not already set in the URL.
    // Keep connection_limit conservative: Railway hobby Postgres allows ~97 total
    // connections; 10 per server instance leaves headroom for multiple deploys / workers.
    // Supabase transaction pooler (6543) needs pgbouncer mode (no prepared statements).
    if (url.port === '6543' && !url.searchParams.has('pgbouncer')) url.searchParams.set('pgbouncer', 'true');
    if (!url.searchParams.has('connection_limit')) url.searchParams.set('connection_limit', IS_SERVERLESS ? '1' : '10');
    if (!url.searchParams.has('pool_timeout'))    url.searchParams.set('pool_timeout', '20');
    if (!url.searchParams.has('connect_timeout')) url.searchParams.set('connect_timeout', '15');
    if (!url.searchParams.has('socket_timeout'))  url.searchParams.set('socket_timeout', '30');
    return url.toString();
  } catch {
    // URL parsing failed (e.g. missing schema) — return as-is and let Prisma surface the error.
    return raw;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private keepaliveTimer: ReturnType<typeof setInterval> | null = null;
  private reconnecting = false;

  constructor() {
    super({
      datasources: { db: { url: buildDatabaseUrl() } },
      log: [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    (this as any).$on('error', (e: { message: string }) => {
      this.logger.error(`Prisma error event: ${e.message}`);
      if (isTransient({ message: e.message })) {
        void this.handleReconnect();
      }
    });

    await this.connectWithRetry(CONNECT_RETRIES);
    // A frozen serverless instance can't run timers; the pooler handles idle sockets.
    if (!IS_SERVERLESS) this.startKeepalive();
  }

  async onModuleDestroy() {
    this.stopKeepalive();
    await this.$disconnect();
  }

  // ---------------------------------------------------------------------------
  // Retry wrapper — use for critical read-paths (auth, refresh) where a single
  // transient error should not surface as a 500 to the user.
  // ---------------------------------------------------------------------------
  async withRetry<T>(op: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= QUERY_RETRIES; attempt++) {
      try {
        return await op();
      } catch (err) {
        if (!isTransient(err) || attempt === QUERY_RETRIES) throw err;
        this.logger.warn(
          `Transient DB error (attempt ${attempt}/${QUERY_RETRIES}): ` +
          (err instanceof Error ? err.message : String(err)),
        );
        // Await reconnect fully before retrying the query — fire-and-forget
        // causes the next attempt to run before the connection is ready.
        await this.handleReconnect();
      }
    }
    throw new Error('Unreachable');
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------
  private async connectWithRetry(retries: number): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
        return;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`DB connect attempt ${attempt}/${retries} failed: ${msg}`);
        if (attempt === retries) throw err;
        await sleep(RETRY_BASE_MS * attempt); // exponential back-off: 1s, 2s, 3s…
      }
    }
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnecting) return;
    this.reconnecting = true;
    this.logger.warn('Reconnecting to database…');
    try {
      await this.$disconnect().catch(() => {});
      await this.connectWithRetry(CONNECT_RETRIES);
      this.logger.log('Database reconnected');
    } catch (err) {
      this.logger.error(
        'Database reconnect failed: ' + (err instanceof Error ? err.message : String(err)),
      );
    } finally {
      this.reconnecting = false;
    }
  }

  // Keepalive: ping every 20 s — Railway proxy drops idle TCP connections around 30 s.
  private startKeepalive(): void {
    this.keepaliveTimer = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
      } catch (err) {
        this.logger.warn(
          'Keepalive ping failed: ' + (err instanceof Error ? err.message : String(err)),
        );
        if (isTransient(err)) void this.handleReconnect();
      }
    }, 20_000);
  }

  private stopKeepalive(): void {
    if (this.keepaliveTimer) {
      clearInterval(this.keepaliveTimer);
      this.keepaliveTimer = null;
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
