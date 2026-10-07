import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuditLogService } from './audit-log.service';

@Injectable()
export class ActivityInterceptor implements NestInterceptor {
  // Throttle: per-user, max once every 60 seconds
  // Bounded: evict entries older than 10 minutes to prevent memory leak
  private lastTouchMap = new Map<string, number>();
  private readonly MAX_ENTRIES = 500;

  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.id;

    if (userId) {
      const now = Date.now();
      const lastTouch = this.lastTouchMap.get(userId) || 0;

      if (now - lastTouch > 60_000) {
        this.lastTouchMap.set(userId, now);
        // Fire and forget - don't await
        this.auditLogService.touchUserActivity(userId).catch(() => {});

        // Evict stale entries if map grows too large
        if (this.lastTouchMap.size > this.MAX_ENTRIES) {
          const cutoff = now - 10 * 60_000;
          for (const [key, ts] of this.lastTouchMap) {
            if (ts < cutoff) this.lastTouchMap.delete(key);
          }
        }
      }
    }

    return next.handle();
  }
}
