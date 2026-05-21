import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { CurrentUserData, OAuthPayload } from '../types';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<CurrentUserData> {
    const email = profile.emails?.[0]?.value;
    if (!email) throw new UnauthorizedException('No email from Google');

    const oauthPayload: OAuthPayload = {
      email,
      displayName: profile.displayName,
      avatarUrl: profile._json.picture,
      googleLinked: true,
    };

    return this.authService.validateOAuthUser(oauthPayload);
  }
}
