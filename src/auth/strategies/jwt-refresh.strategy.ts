import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { RefreshTokenPayload } from '../types';
import { extractCookie } from '../utils/extract-cookie.util';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractCookie(req, 'refresh_token'),
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      ignoreExpiration: false,
    });
  }

  validate(payload: RefreshTokenPayload): RefreshTokenPayload {
    if (!payload.refresh_token_id) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return payload;
  }
}
