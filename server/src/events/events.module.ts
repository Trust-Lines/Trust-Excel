import { Module, Global } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { RealtimeController } from './realtime.controller';

@Global()
@Module({
  controllers: [RealtimeController],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
