import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

/**
 * Vercel Function entry: builds the Nest app once per warm instance and
 * reuses the Express handler for every request.
 */
let cached: Promise<express.Express> | null = null;

async function createServer(): Promise<express.Express> {
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn', 'log'],
  });
  configureApp(app);
  await app.init();
  new Logger('Bootstrap').log('Trust Lines API initialised (serverless)');
  return server;
}

export async function getServer(): Promise<express.Express> {
  if (!cached) {
    cached = createServer().catch((err) => {
      cached = null; // allow the next request to retry a failed cold start
      throw err;
    });
  }
  return cached;
}

export default async function handler(req: any, res: any) {
  const server = await getServer();
  return server(req, res);
}
