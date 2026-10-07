import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { VendorsModule } from './vendors/vendors.module';
import { OrderTypesModule } from './order-types/order-types.module';
import { AdminModule } from './admin/admin.module';
import { EmailModule } from './email/email.module';
import { MissingExtraModule } from './missing-extra/missing-extra.module';
import { PaymentRulesModule } from './payment-rules/payment-rules.module';
import { CustomTypesModule } from './custom-types/custom-types.module';
import { DirectOrdersModule } from './direct-orders/direct-orders.module';
import { SupplierProfilesModule } from './supplier-profiles/supplier-profiles.module';
import { SupplierInvoiceReceiptsModule } from './supplier-invoice-receipts/supplier-invoice-receipts.module';
import { ContainersModule } from './containers/containers.module';
import { PermissionsModule } from './permissions/permissions.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { SupplierTotalsModule } from './supplier-totals/supplier-totals.module';
import { ProjectTotalsModule } from './project-totals/project-totals.module';
import { TrustExpensesModule } from './trust-expenses/trust-expenses.module';
import { ExpensesPModule } from './expenses-p/expenses-p.module';
import { ExpensesDirectOrderModule } from './expenses-direct-order/expenses-direct-order.module';
import { ExpensesMissingExtraModule } from './expenses-missing-extra/expenses-missing-extra.module';
import { ActivityInterceptor } from './audit-log/activity.interceptor';
import { EventsModule } from './events/events.module';
import { BackupModule } from './backup/backup.module';
import { AdminAlertModule } from './admin-alert/admin-alert.module';
import { TrashBinModule } from './trash-bin/trash-bin.module';
import { DropboxModule } from './dropbox/dropbox.module';
import { PriceListModule } from './price-list/price-list.module';
import { TodayPfModule } from './today-pf/today-pf.module';
import { PfGroupsModule } from './pf-groups/pf-groups.module';
import { CronModule } from './cron/cron.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // In-process timers only when running as a long-lived server; on Vercel
    // the same jobs are triggered by Vercel Cron via /api/cron/*.
    ...(process.env.VERCEL ? [] : [ScheduleModule.forRoot()]),
    ThrottlerModule.forRoot([{
      ttl: 60000,   // 60 seconds
      limit: 200,   // 200 requests per TTL window (operational board can burst ~100 on rapid edits)
    }]),
    AdminAlertModule,
    PrismaModule,
    AuthModule,
    ProjectsModule,
    VendorsModule,
    OrderTypesModule,
    AdminModule,
    EmailModule,
    MissingExtraModule,
    PaymentRulesModule,
    CustomTypesModule,
    DirectOrdersModule,
    SupplierProfilesModule,
    SupplierInvoiceReceiptsModule,
    ContainersModule,
    PermissionsModule,
    AuditLogModule,
    SupplierTotalsModule,
    ProjectTotalsModule,
    TrustExpensesModule,
    ExpensesPModule,
    ExpensesDirectOrderModule,
    ExpensesMissingExtraModule,
    EventsModule,
    BackupModule,
    TrashBinModule,
    DropboxModule,
    PriceListModule,
    TodayPfModule,
    PfGroupsModule,
    CronModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityInterceptor,
    },
  ],
})
export class AppModule {}