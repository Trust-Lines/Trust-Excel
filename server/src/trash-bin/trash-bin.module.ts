import { Module, OnModuleInit } from '@nestjs/common';
import { TrashBinService } from './trash-bin.service';
import { TrashBinController } from './trash-bin.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [PrismaModule, AuditLogModule],
  controllers: [TrashBinController],
  providers: [TrashBinService],
  exports: [TrashBinService],
})
export class TrashBinModule implements OnModuleInit {
  constructor(private readonly trashBinService: TrashBinService) {}

  async onModuleInit() {
    await this.trashBinService.seedPagePermission();
  }
}
