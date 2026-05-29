import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Observable } from 'rxjs';
import type { Request } from 'express';
import type { CurrentUserData } from '../auth/types';

@Injectable()
export class AuditContextInterceptor implements NestInterceptor {
  constructor(private readonly cls: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: CurrentUserData }>();
    this.cls.set('userId', request.user?.id ?? null);
    return next.handle();
  }
}
