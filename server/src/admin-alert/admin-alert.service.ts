import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';

export type AlertSeverity = 'error' | 'warning' | 'critical';

export interface AlertContext {
  source?: string;
  userId?: string;
  userEmail?: string;
  entityId?: string;
  entityType?: string;
  action?: string;
  extra?: Record<string, unknown>;
}

export interface AlertPayload {
  severity: AlertSeverity;
  title: string;
  message: string;
  error?: Error | unknown;
  context?: AlertContext;
}

@Injectable()
export class AdminAlertService {
  private readonly logger = new Logger(AdminAlertService.name);
  private readonly adminEmail: string;
  private readonly env: string;

  // key -> timestamp of last alert sent (prevents spam)
  private readonly throttleMap = new Map<string, number>();
  private readonly THROTTLE_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_THROTTLE_ENTRIES = 500;

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.adminEmail = configService.get<string>('ADMIN_ALERT_EMAIL', 'hghannom@gmail.com');
    this.env = configService.get<string>('NODE_ENV', 'development');
  }

  async alert(payload: AlertPayload): Promise<void> {
    try {
      const key = this.buildThrottleKey(payload);
      if (this.isThrottled(key)) return;
      this.recordThrottle(key);

      const subject = this.buildSubject(payload);
      const html = this.buildEmailHtml(payload);

      await this.emailService.sendRawEmail({ to: this.adminEmail, subject, html });

      this.logger.log(`Admin alert sent [${payload.severity.toUpperCase()}]: ${payload.title}`);
    } catch (err) {
      // Must never crash — only log
      this.logger.error('AdminAlertService.alert failed silently:', (err as Error)?.message);
    }
  }

  error(title: string, message: string, error?: unknown, context?: AlertContext): Promise<void> {
    return this.alert({ severity: 'error', title, message, error, context });
  }

  warning(title: string, message: string, context?: AlertContext): Promise<void> {
    return this.alert({ severity: 'warning', title, message, context });
  }

  critical(title: string, message: string, error?: unknown, context?: AlertContext): Promise<void> {
    return this.alert({ severity: 'critical', title, message, error, context });
  }

  private buildThrottleKey(payload: AlertPayload): string {
    const msg = (payload.message ?? '').slice(0, 60);
    return `${payload.severity}:${payload.title}:${msg}`;
  }

  private isThrottled(key: string): boolean {
    const last = this.throttleMap.get(key);
    if (!last) return false;
    if (Date.now() - last > this.THROTTLE_MS) {
      this.throttleMap.delete(key);
      return false;
    }
    return true;
  }

  private recordThrottle(key: string): void {
    if (this.throttleMap.size >= this.MAX_THROTTLE_ENTRIES) {
      // Evict oldest entries to prevent unbounded memory growth
      const cutoff = Date.now() - this.THROTTLE_MS;
      for (const [k, ts] of this.throttleMap) {
        if (ts < cutoff) this.throttleMap.delete(k);
      }
      // If still too large, clear entirely
      if (this.throttleMap.size >= this.MAX_THROTTLE_ENTRIES) this.throttleMap.clear();
    }
    this.throttleMap.set(key, Date.now());
  }

  private buildSubject(payload: AlertPayload): string {
    const badge =
      payload.severity === 'critical' ? '🚨' :
      payload.severity === 'error' ? '❌' : '⚠️';
    return `${badge} [Trust Lines ${this.env.toUpperCase()}] ${payload.title}`;
  }

  private buildEmailHtml(payload: AlertPayload): string {
    const { severity, title, message, error, context } = payload;

    const palette = {
      critical: { header: '#6C0E23', accent: '#C0392B', badgeBg: '#FADBD8', badgeText: '#7B241C' },
      error:    { header: '#B03A2E', accent: '#E74C3C', badgeBg: '#FADBD8', badgeText: '#922B21' },
      warning:  { header: '#9A640A', accent: '#F39C12', badgeBg: '#FDEBD0', badgeText: '#B7770D' },
    };
    const p = palette[severity];

    const errorMessage = error instanceof Error ? error.message : error ? String(error) : undefined;
    const stack = error instanceof Error ? error.stack : undefined;
    const timestamp = new Date().toISOString();

    const metaRows: Array<{ label: string; value: string }> = [
      { label: 'Timestamp',   value: timestamp },
      { label: 'Environment', value: this.env.toUpperCase() },
      ...(context?.source     ? [{ label: 'Source',      value: context.source }]      : []),
      ...(context?.action     ? [{ label: 'Action',      value: context.action }]      : []),
      ...(context?.userId     ? [{ label: 'User ID',     value: context.userId }]      : []),
      ...(context?.userEmail  ? [{ label: 'User Email',  value: context.userEmail }]   : []),
      ...(context?.entityType ? [{ label: 'Entity Type', value: context.entityType }]  : []),
      ...(context?.entityId   ? [{ label: 'Entity ID',   value: context.entityId }]    : []),
    ];

    const tableRowsHtml = metaRows
      .map(
        (r) => `
        <tr>
          <td style="padding:8px 14px;font-size:12px;color:#6b7280;white-space:nowrap;border-bottom:1px solid #f3f4f6;width:130px;vertical-align:top;">${esc(r.label)}</td>
          <td style="padding:8px 14px;font-size:12px;color:#111827;border-bottom:1px solid #f3f4f6;word-break:break-all;">${esc(r.value)}</td>
        </tr>`,
      )
      .join('');

    const extraSection = context?.extra
      ? `<div style="margin-top:18px;">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Extra Context</p>
          <pre style="margin:0;padding:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;font-size:11px;color:#374151;white-space:pre-wrap;word-break:break-all;font-family:'Courier New',monospace;">${esc(JSON.stringify(context.extra, null, 2))}</pre>
        </div>`
      : '';

    const stackSection = stack
      ? `<div style="margin-top:18px;">
          <p style="margin:0 0 6px 0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;">Stack Trace</p>
          <pre style="margin:0;padding:12px 14px;background:#1e1e2e;color:#cdd6f4;font-size:11px;border-radius:6px;white-space:pre-wrap;word-break:break-all;font-family:'Courier New',monospace;line-height:1.55;">${esc(stack)}</pre>
        </div>`
      : '';

    const displayMessage = message !== errorMessage
      ? message + (errorMessage ? `\n\nError: ${errorMessage}` : '')
      : message;

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Admin Alert</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width:640px;width:100%;" cellspacing="0" cellpadding="0" border="0">

          <!-- HEADER -->
          <tr>
            <td style="background:${p.header};padding:26px 30px;border-radius:10px 10px 0 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;">
                    <p style="margin:0 0 3px 0;font-size:11px;color:rgba(255,255,255,.65);text-transform:uppercase;letter-spacing:.08em;">Trust Lines — Internal System Alert</p>
                    <h1 style="margin:0;font-size:20px;font-weight:700;color:#fff;line-height:1.3;">${esc(title)}</h1>
                  </td>
                  <td align="right" style="vertical-align:top;padding-left:12px;white-space:nowrap;">
                    <span style="display:inline-block;padding:4px 12px;background:rgba(255,255,255,.2);border-radius:20px;font-size:11px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.07em;">${severity}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:#fff;padding:26px 30px;">

              <!-- Alert message box -->
              <div style="padding:13px 16px;background:${p.badgeBg};border-left:4px solid ${p.accent};border-radius:0 6px 6px 0;margin-bottom:20px;">
                <pre style="margin:0;font-size:13px;color:${p.badgeText};white-space:pre-wrap;word-break:break-all;font-family:'Courier New',monospace;line-height:1.6;">${esc(displayMessage)}</pre>
              </div>

              <!-- Metadata table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
                ${tableRowsHtml}
              </table>

              ${extraSection}
              ${stackSection}

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#f8f9fa;padding:14px 30px;border-radius:0 0 10px 10px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:11px;color:#9ca3af;">Trust Lines · Internal Admin Alert · Sent to ${esc(this.adminEmail)}</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

function esc(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
