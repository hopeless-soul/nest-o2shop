import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but never rejects the request. If a valid access token
 * is present, req.user is populated as usual; otherwise the route proceeds
 * unauthenticated (req.user stays undefined) instead of throwing.
 *
 * For routes that must behave differently for guests vs. logged-in users
 * (e.g. POST /orders) without requiring a session.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // No/invalid token — proceed unauthenticated rather than reject.
    }
    return true;
  }

  handleRequest<TUser = any>(_err: any, user: any): TUser {
    return user as TUser;
  }
}
