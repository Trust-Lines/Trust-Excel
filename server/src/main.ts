import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

const logger = new Logger('Bootstrap');

/** Local / long-running server. On Vercel, serverless.ts is used instead. */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'], // Suppress 'debug' and 'verbose' in production
  });
  const { configService, adminAlertService } = configureApp(app);

  // ── GRACEFUL SHUTDOWN ──────────────────────────────────────────────
  app.enableShutdownHooks(); // Calls onModuleDestroy on SIGTERM/SIGINT

  // ── PROCESS-LEVEL CRASH GUARDS ─────────────────────────────────────
  process.on('unhandledRejection', (reason: any) => {
    logger.error('UNHANDLED_REJECTION — shutting down', reason?.stack || reason);
    adminAlertService
      .critical(
        'Unhandled Promise Rejection',
        reason?.message ?? String(reason),
        reason instanceof Error ? reason : undefined,
        { source: 'process.unhandledRejection' },
      )
      .catch(() => {})
      .finally(() => setTimeout(() => process.exit(1), 3000));
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('UNCAUGHT_EXCEPTION — shutting down', error.stack);
    adminAlertService
      .critical('Uncaught Exception', error.message, error, { source: 'process.uncaughtException' })
      .catch(() => {})
      .finally(() => setTimeout(() => process.exit(1), 3000));
  });

  const port = configService.get('PORT', 3001);
  await app.listen(port);

  logger.log(`Trust Lines Backend running on port ${port}`);
}

bootstrap().catch((err) => {
  logger.error('BOOTSTRAP FAILED', err);
  process.exit(1);
});
