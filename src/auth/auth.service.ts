import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AccessTokenPayload,
  CurrentUserData,
  OAuthPayload,
  RefreshTokenPayload,
  toCurrentUserData,
  Tokens,
} from './types';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { HashingService } from '../common/hashing/hashing.service';

/**
 * TODO:
 *    -- implement refresh tokens rotation (currently just issues both tokens)
 */

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly hashingService: HashingService,
  ) {}

  /**
   * Finds or creates a user from an OAuth provider profile.
   *
   * Called by the OAuth strategy's validate() method after a successful
   * provider handshake. If the email already exists in the DB the existing
   * user is returned; otherwise a new account is created from the OAuth payload.
   *
   * The returned user is attached to req.user by Passport.
   *
   * @param data - Normalized profile data extracted from the OAuth provider
   * @returns The found or newly created user as CurrentUserData
   */
  async validateOAuthUser(data: OAuthPayload): Promise<CurrentUserData> {
    console.log('validateUser -->');
    console.log(data);

    let user = await this.usersService.findByEmail(data.email);

    if (!user) {
      user = await this.usersService.createFromOAuth({
        email: data.email,
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        googleLinked: true,
      });
    }

    // Return user — passport attaches it to req.user
    return toCurrentUserData(user);
  }

  async validateLocalUser(
    email: string,
    password: string,
  ): Promise<CurrentUserData> {
    const user = await this.usersService.findByEmail(email, {
      select: {
        id: true,
        email: true,
        password: true,
        googleLinked: true,
        tokenVersion: true,
      },
    });

    console.log('validateLocalUser -->');
    console.log(user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.googleLinked && !user.password) {
      throw new UnauthorizedException('This account uses Google sign-in');
    }
    const isValid = await this.hashingService.compare(password, user.password!);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return toCurrentUserData(user);
  }

  /**
   * Issues a new access/refresh token pair for the given user.
   *
   * Fetches the current tokenVersion from the DB to embed in the access token,
   * allowing invalidation of all tokens on logout or password change.
   *
   * Generates a unique refresh token ID (rtId) stored server-side,
   * enabling refresh token rotation and reuse detection.
   *
   * @param user - Authenticated user identity from req.user
   * @returns Signed access and refresh token pair
   * @throws NotFoundException if the user no longer exists in the DB
   */
  async issueTokens(user: CurrentUserData): Promise<Tokens> {
    const rtId = randomUUID();
    const { id, ...rest } = user;

    const currentData = await this.usersService.findById(id, {
      select: { tokenVersion: true },
    });

    if (!currentData) {
      throw new NotFoundException('Current user is not found');
    }

    const [at, rt] = await Promise.all([
      // Access Token JWT
      this.signToken<Partial<AccessTokenPayload>>(
        user.id,
        this.configService.getOrThrow<string>('JWT_SECRET'),
        this.configService.getOrThrow<number>('JWT_ACCESS_TOKEN_TTL'),
        { ...rest, tokenVersion: currentData.tokenVersion },
      ),
      // Refresh Token JWT
      this.signToken<Partial<RefreshTokenPayload>>(
        user.id,
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        this.configService.getOrThrow<number>('JWT_REFRESH_TOKEN_TTL'),
        {
          refresh_token_id: rtId,
        },
      ),
    ]);
    await this.saveRefreshToken(user.id, rtId, rt);
    return {
      access_token: at,
      refresh_token: rt,
    };
  }

  /**
   * Sign a JWT token with standard claims and optional payload data.
   *
   * The token always includes the user's ID as the `sub` claim, and it uses
   * shared JWT configuration from the application settings.
   */
  private async signToken<T>(
    userId: string,
    secret: string,
    expiresIn: number,
    payload?: T,
  ) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        // audience:
        // issuer:
        secret,
        expiresIn,
      },
    );
  }

  // TODO:
  /**
   * Hashes and persists a refresh token for the given user.
   * Creates a new entry if none exists, or replaces the existing one (single-session enforcement).
   */
  private async saveRefreshToken(
    userId: string,
    refreshTokenId: string,
    refreshToken: string,
  ) {}
}
