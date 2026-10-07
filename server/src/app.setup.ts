import { INestApplication, ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import * as compression from 'compression';
import * as express from 'express';
import { AdminAlertService } from './admin-alert/admin-alert.service';
import { AllExceptionsFilter } from './admin-alert/all-exceptions.filter';

const logger = new Logger('Bootstrap');

/**
 * Middleware / pipes / filters shared by the local server (main.ts)
 * and the Vercel Function (serverless.ts).
 */
export function configureApp(app: INestApplication) {
  const configService = app.get(ConfigService);
  const adminAlertService = app.get(AdminAlertService);

  // ── GLOBAL EXCEPTION FILTER ────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter(adminAlertService));

  // Trust proxy (Vercel / reverse proxy in front)
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set('trust proxy', 1);

  // ── BODY SIZE LIMITS ───────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Enable CORS for frontend. On Vercel the frontend and API share one
  // origin, so most requests carry no cross-origin Origin at all.
  const frontendUrl = configService.get('FRONTEND_URL', '');
  const vercelUrls = [process.env.VERCEL_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_BRANCH_URL]
    .filter(Boolean)
    .map((h) => `https://${h}`);
  const allowedOrigins = [
    ...String(frontendUrl).split(',').map((s) => s.trim()),
    ...vercelUrls,
    'http://localhost:3000', // Development
    'http://localhost:5173', // Development
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Security headers (CSP disabled until frontend asset sources are inventoried)
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));

  // Gzip compression for all responses
  app.use(compression());

  // Cookie parser for refresh tokens
  app.use(cookieParser());

  // ── REQUEST TIMEOUT ────────────────────────────────────────────────
  // Kill requests that hang longer than 30s (prevents connection pile-up)
  app.use((req, res, next) => {
    res.setTimeout(30_000, () => {
      if (!res.headersSent) {
        res.status(408).json({ message: 'Request timeout' });
      }
    });
    next();
  });

  // Global prefix
  app.setGlobalPrefix('api');

  return { configService, adminAlertService };
}
