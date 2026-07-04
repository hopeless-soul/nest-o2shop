import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { Role } from '../../users/enums/role.enum';
import type { CurrentUserData } from '../types';

@Injectable()
export class AdminThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: CurrentUserData }>();

    if (request.user?.role === Role.ADMIN) return true;

    return super.shouldSkip(context);
  }
}
