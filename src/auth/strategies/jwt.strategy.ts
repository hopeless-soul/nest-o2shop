import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import {
  AccessTokenPayload,
  CurrentUserData,
  toCurrentUserData,
} from '../types';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJwtFromCookies,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
  }

  /**
   * Extracts a JWT from the request cookies by name.
   *
   * Used as a custom extractor in Passport JWT strategies
   * instead of the default Bearer token extraction from headers.
   *
   * @param request - Incoming HTTP request
   * @param cookieName - Cookie key to extract from (default: 'access_token')
   * @returns The raw JWT string, or null if the cookie is absent
   */
  private static extractJwtFromCookies(
    request: Request,
    cookieName: string = 'access_token',
  ): string | null {
    if (request.cookies && request?.cookies[cookieName]) {
      return request.cookies[cookieName];
    }
    return null;
  }

  async validate(payload: AccessTokenPayload): Promise<CurrentUserData> {
    const user = await this.usersService.findById(payload.sub, {
      select: { tokenVersion: true, role: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }
    if (user.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedException('Token is outdated');
    }
    return { ...toCurrentUserData(payload), role: user.role };
  }
}
