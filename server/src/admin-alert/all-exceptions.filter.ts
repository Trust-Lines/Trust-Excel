import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminAlertService } from './admin-alert.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly adminAlertService: AdminAlertService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : (body as any)?.message ?? message;
      if (Array.isArray(message)) message = message.join('; ');
    } else if (exception instanceof Error) {
      message = exception.message;
    } else if (exception !== null && exception !== undefined) {
      message = String(exception);
    }

    // Alert admin only for server-side errors (5xx); skip 4xx client errors
    if (status >= 500) {
      const user = (request as any).user as { id?: string; email?: string } | undefined;

      this.adminAlertService
        .alert({
          severity: 'error',
          title: `HTTP ${status} — ${request.method} ${request.path}`,
          message,
          error: exception instanceof Error ? exception : undefined,
          context: {
            source: 'AllExceptionsFilter',
            action: `${request.method} ${request.path}`,
            userId: user?.id,
            userEmail: user?.email,
          },
        })
        .catch(() => {}); // fire-and-forget, never delay the response
    } else {
      // Log 4xx at debug level only — no admin alert
      this.logger.debug(`[${status}] ${request.method} ${request.path} — ${message}`);
    }

    if (!response.headersSent) {
      response.status(status).json({
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }
  }
}
