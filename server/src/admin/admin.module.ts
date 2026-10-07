import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { TypeVisibilityService } from '../permissions/services/type-visibility.service';
import { ProjectScopeService } from '../permissions/services/project-scope.service';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    EmailModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, TypeVisibilityService, ProjectScopeService],
  exports: [AdminService, TypeVisibilityService, ProjectScopeService],
})
export class AdminModule {}