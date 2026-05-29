import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { AuditContextInterceptor } from './audit-context.interceptor';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { AuditSubscriber } from './audit.subscriber';
import { AuditLog } from './entities/audit-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog]), ClsModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    AuditSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
  ],
})
export class AuditModule {}
