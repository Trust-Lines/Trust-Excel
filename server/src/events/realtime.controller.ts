import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsGateway, ALL_ROOM } from './events.gateway';

/**
 * Hands the Supabase Realtime connection details to logged-in users only.
 * The channel prefix is a server-side secret, so the channels can't be
 * subscribed to by someone who just has the (public) publishable key.
 */
@Controller('realtime')
@UseGuards(JwtAuthGuard)
export class RealtimeController {
  constructor(
    private readonly config: ConfigService,
    private readonly events: EventsGateway,
  ) {}

  @Get('config')
  getConfig() {
    const url = this.config.get<string>('SUPABASE_URL') || '';
    const key = this.config.get<string>('SUPABASE_PUBLISHABLE_KEY') || '';
    return {
      enabled: !!(url && key),
      url,
      key,
      channelPrefix: this.events.channelPrefix,
      allRoom: ALL_ROOM,
    };
  }
}
