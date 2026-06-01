import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshAuthGuard extends AuthGuard('jwt-refresh') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = (await super.canActivate(context)) as boolean;
    console.log('Can activate: ', can);
    return (can) as boolean;
  }

  handleRequest<TUser = any>(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): TUser {
    if (info instanceof TokenExpiredError) {
      console.log('Refresh token expired')
      throw new UnauthorizedException('Refresh token expired');
    }
    if (info instanceof JsonWebTokenError) {
      console.log('Invalid refresh token')
      throw new UnauthorizedException('Invalid refresh token');
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
