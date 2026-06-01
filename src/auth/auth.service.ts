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
import { DataSource, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { CreateLocalUserDto } from '../users/dto/create-local-user.dto';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { HashingService } from '../common/hashing/hashing.service';
import { RefreshToken } from './entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
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
  async register(dto: CreateLocalUserDto): Promise<CurrentUserData> {
    return this.usersService.createFromLocal(dto);
  }

  async validateOAuthUser(data: OAuthPayload): Promise<CurrentUserData> {
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
    // Use array-form select so the password column (select:false) is reliably included.
    const user = await this.usersService.findByEmail(email, {
      select: { id: true, email: true, role: true, password: true, googleLinked: true, tokenVersion: true, isActive: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
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
        parseInt(this.configService.getOrThrow('JWT_ACCESS_TOKEN_TTL')),
        { ...rest, tokenVersion: currentData.tokenVersion },
      ),
      // Refresh Token JWT
      this.signToken<Partial<RefreshTokenPayload>>(
        user.id,
        this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        parseInt(this.configService.getOrThrow('JWT_REFRESH_TOKEN_TTL')),
        {
          refresh_token_id: rtId,
        },
      ),
    ]);
    await this.saveRefreshToken(user.id, rtId);
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

  async refreshTokens(userId: string, tokenId: string): Promise<Tokens> {
    const stored = await this.refreshTokenRepo.findOne({
      where: { userId, tokenId },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(userId, {
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    await this.refreshTokenRepo.delete({ id: stored.id });

    return this.issueTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async logout(userId: string): Promise<void> {
    await Promise.all([
      this.usersService.incrementTokenVersion(userId),
      this.refreshTokenRepo.delete({ userId }),
    ]);
  }

  private async saveRefreshToken(
    userId: string,
    refreshTokenId: string,
  ): Promise<void> {
    const ttl = parseInt(
      this.configService.getOrThrow('JWT_REFRESH_TOKEN_TTL'),
    );
    const expiresAt = new Date(Date.now() + ttl * 1000);

    await this.dataSource.transaction(async (em) => {
      await em.delete(RefreshToken, { userId });
      await em.save(
        em.create(RefreshToken, { userId, tokenId: refreshTokenId, expiresAt }),
      );
    });
  }
}
