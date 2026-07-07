import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard, but only treats a *missing* token as anonymous access.
 * If a token is present and invalid/expired, it still throws — a logged-in
 * user with a stale access token gets a 401 (so the client can refresh and
 * retry) instead of being silently downgraded to a guest, which previously
 * caused orders placed with an expired session to be created unlinked from
 * the user's account.
 *
 * For routes that must behave differently for guests vs. logged-in users
 * (e.g. POST /orders) without requiring a session.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    return (await super.canActivate(context)) as boolean;
  }

  handleRequest<TUser = any>(err: any, user: any, info: any): TUser {
    const noTokenPresented =
      !err && !user && info instanceof Error && info.message === 'No auth token';
    if (noTokenPresented) {
      return undefined as TUser;
    }
    if (info instanceof TokenExpiredError) {
      throw new UnauthorizedException('Access token expired');
    }
    if (info instanceof JsonWebTokenError) {
      throw new UnauthorizedException('Invalid access token');
    }
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user as TUser;
  }
}
