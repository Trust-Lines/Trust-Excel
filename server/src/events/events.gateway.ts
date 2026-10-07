import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

/** Payload shape for patch-based real-time events */
export interface PatchEventPayload {
  entity: string;       // e.g. 'projectItem', 'directOrderItem', 'meItem', etc.
  entityId: string;
  parentId: string;     // projectId or caseId
  patch: Record<string, any>;  // only changed fields
  updatedAt: string;    // ISO string
  updatedBy: string;    // userId
  mutationId: string;   // uuid for dedup
}

/**
 * Compare oldObj vs newObj and return only the changed fields.
 * Handles Date, Decimal, null, and primitive comparisons.
 * Skips internal fields like 'id', 'createdAt', 'projectId', 'vendor', 'customType', 'orderTypeRef'.
 */
export function computePatch(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  skipFields: string[] = ['id', 'createdAt', 'projectId', 'caseId', 'vendor', 'customType', 'orderTypeRef', 'createdBy'],
): Record<string, any> {
  const patch: Record<string, any> = {};
  for (const key of Object.keys(newObj)) {
    if (skipFields.includes(key)) continue;
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Normalize for comparison
    const oldStr = oldVal instanceof Date ? oldVal.toISOString()
      : oldVal?.toString?.() ?? String(oldVal);
    const newStr = newVal instanceof Date ? newVal.toISOString()
      : newVal?.toString?.() ?? String(newVal);

    if (oldStr !== newStr) {
      // Serialize dates to ISO for transport
      patch[key] = newVal instanceof Date ? newVal.toISOString() : newVal;
    }
  }
  return patch;
}

/** Channel used for emitToAll (every client subscribes to it). */
export const ALL_ROOM = '__all__';

/** Envelope sent over Supabase Realtime Broadcast; the client unwraps it. */
export interface RealtimeEnvelope {
  event: string;
  data: any;
  excludeUserId?: string;
}

/**
 * Real-time event publisher.
 *
 * Previously a Socket.IO gateway; on Vercel there is no long-lived process,
 * so events are published through Supabase Realtime Broadcast (REST API).
 * Public API (emitToRooms / emitToAll / emitPatchEvent) is unchanged, so no
 * calling service had to change.
 *
 * Each "room" maps to the Supabase channel `${REALTIME_CHANNEL_SECRET}:${room}`.
 * The secret prefix is only handed to authenticated users via
 * GET /api/realtime/config, so outsiders holding the publishable key cannot
 * guess the channel names.
 */
@Injectable()
export class EventsGateway {
  private readonly logger = new Logger(EventsGateway.name);
  private readonly endpoint: string | null;
  private readonly secretKey: string | null;
  readonly channelPrefix: string;

  constructor(private configService: ConfigService) {
    const url = (this.configService.get<string>('SUPABASE_URL') || '').replace(/\/+$/, '');
    this.endpoint = url ? `${url}/realtime/v1/api/broadcast` : null;
    this.secretKey = this.configService.get<string>('SUPABASE_SECRET_KEY') || null;
    this.channelPrefix = this.configService.get<string>('REALTIME_CHANNEL_SECRET') || 'trust';
    if (!this.endpoint || !this.secretKey) {
      this.logger.warn('Realtime disabled: SUPABASE_URL / SUPABASE_SECRET_KEY not set');
    }
  }

  topicFor(room: string): string {
    return `${this.channelPrefix}:${room}`;
  }

  private publish(rooms: string[], envelope: RealtimeEnvelope) {
    if (!this.endpoint || !this.secretKey || rooms.length === 0) return;

    const body = JSON.stringify({
      messages: rooms.map((room) => ({
        topic: this.topicFor(room),
        event: 'message',
        payload: envelope,
        private: false,
      })),
    });

    const request = fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: this.secretKey,
        Authorization: `Bearer ${this.secretKey}`,
      },
      body,
    })
      .then(async (res) => {
        if (!res.ok) {
          this.logger.warn(`Realtime broadcast failed (${res.status}): ${await res.text().catch(() => '')}`);
        }
      })
      .catch((err) => this.logger.warn(`Realtime broadcast error: ${err?.message || err}`));

    // On Vercel keep the function alive until the broadcast is delivered,
    // without delaying the HTTP response.
    keepAlive(request);
  }

  /**
   * Emit an event to one or more rooms.
   * Called by services after DB mutations.
   * If excludeUserId is provided, that user's clients ignore the event
   * (they already have fresh data from their own API response).
   */
  emitToRooms(rooms: string[], event: string, data: any, excludeUserId?: string) {
    this.publish(rooms, { event, data, excludeUserId });
  }

  /**
   * Emit to all connected clients (e.g. permissions:updated)
   */
  emitToAll(event: string, data: any) {
    this.publish([ALL_ROOM], { event, data });
  }

  /** Presence is not tracked server-side any more. */
  getConnectedUserCount(): number {
    return 0;
  }

  /**
   * Generate a unique mutation ID for patch deduplication.
   */
  static generateMutationId(): string {
    return randomUUID();
  }

  /**
   * Emit a patch-based event to rooms.
   * Unlike emitToRooms, this does NOT exclude the originating user —
   * the frontend uses mutationId to deduplicate its own updates.
   * This allows the originator to receive server-confirmed values.
   */
  emitPatchEvent(rooms: string[], payload: PatchEventPayload) {
    // Skip if patch is empty (no fields actually changed)
    if (Object.keys(payload.patch).length === 0) {
      return;
    }
    this.publish(rooms, { event: 'entity:patched', data: payload });
  }
}

let vercelWaitUntil: ((p: Promise<unknown>) => void) | null | undefined;
function keepAlive(p: Promise<unknown>) {
  if (vercelWaitUntil === undefined) {
    vercelWaitUntil = null;
    if (process.env.VERCEL) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        vercelWaitUntil = require('@vercel/functions').waitUntil;
      } catch {
        vercelWaitUntil = null;
      }
    }
  }
  if (vercelWaitUntil) {
    try { vercelWaitUntil(p); } catch { /* outside a request context */ }
  }
}
