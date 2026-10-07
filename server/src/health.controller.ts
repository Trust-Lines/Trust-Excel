import { Controller, Get, HttpCode } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from './prisma/prisma.service';
import { Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('health')
@SkipThrottle()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(@Res() res: Response) {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return res.status(200).json({
        status: 'ok',
        db: 'connected',
        uptime: process.uptime(),
        memMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        latencyMs: Date.now() - start,
      });
    } catch {
      // HTTP 503 — UptimeRobot treats this as DOWN and sends alert email
      return res.status(503).json({
        status: 'degraded',
        db: 'disconnected',
        uptime: process.uptime(),
        memMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        latencyMs: Date.now() - start,
      });
    }
  }
}
