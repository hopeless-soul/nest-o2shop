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
import { extractCookie } from '../utils/extract-cookie.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => extractCookie(req, 'access_token'),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
      ignoreExpiration: false,
    });
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
