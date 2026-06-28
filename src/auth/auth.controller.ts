import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import type { CurrentUserData, RefreshTokenPayload, Tokens } from './types';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { SkipThrottle } from '@nestjs/throttler';
import { CurrentUser } from './decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { CreateLocalUserDto } from '../users/dto/create-local-user.dto';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('Auth')
// Default throttler applies to the whole controller; login and register override to auth throttler below
@SkipThrottle({ auth: true })
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @ApiOperation({
    summary: 'Initiate Google OAuth 2.0 login',
    description:
      'Redirects to the Google consent screen. Not usable from Swagger UI — open this URL directly in a browser.',
  })
  @ApiOkResponse({ description: 'Redirects to Google consent page' })
  @Get('google/login')
  @Auth(AuthType.Google)
  googleLogin() {
    return { message: 'Google Authentication' };
  }

  @ApiOperation({
    summary: 'Google OAuth 2.0 callback',
    description:
      'Handles redirect from Google. Sets access_token and refresh_token as HttpOnly cookies, then redirects to /.',
  })
  // OAuth callback is initiated by Google's servers, not the user — exempt from rate limits
  @SkipThrottle()
  @Get('google/redirect')
  @Auth(AuthType.Google)
  async googleCallback(
    @Req() request: { user: CurrentUserData },
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.issueTokens(request.user);
    this.setTokenCookies(response, tokens);
    response.redirect('/');
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', example: 'strongP@ss1' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Returns JWT tokens and sets HttpOnly cookies',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string', description: 'JWT access token' },
        refresh_token: { type: 'string', description: 'JWT refresh token' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password' })
  // Skip "default"; Use the strict "auth" throttler (skips the lenient "default" one)
  @SkipThrottle({ default: true })
  @Post('login')
  @Auth(AuthType.Local)
  @HttpCode(HttpStatus.OK)
  async localLogin(
    @CurrentUser() user: CurrentUserData,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.issueTokens(user);
    this.setTokenCookies(response, tokens);
    return tokens;
  }

  @ApiOperation({ summary: 'Exchange refresh token for a new token pair' })
  @ApiOkResponse({
    description: 'New access and refresh tokens issued; cookies updated',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, expired, or already-used refresh token',
  })
  @Post('refresh')
  @Auth(AuthType.Refresh)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request & { user: RefreshTokenPayload },
    @Res({ passthrough: true }) response: Response,
  ): Promise<Tokens> {
    const tokens = await this.authService.refreshTokens(
      request.user.sub,
      request.user.refresh_token_id,
    );
    this.setTokenCookies(response, tokens);
    return tokens;
  }

  @ApiOperation({ summary: 'Register a new account with email and password' })
  @ApiBody({ type: CreateLocalUserDto })
  @ApiCreatedResponse({
    type: UserResponseDto,
    description: 'User created successfully',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'Validation error or email already in use',
  })
  // Use the strict "auth" throttler (skips the lenient "default" one)
  @SkipThrottle({ default: true })
  @Post('register')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.CREATED)
  localRegister(@Body() dto: CreateLocalUserDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Log out and invalidate all tokens' })
  @ApiNoContentResponse({ description: 'Logged out; cookies cleared' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid JWT' })
  @Delete('logout')
  @Auth(AuthType.Bearer)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() user: CurrentUserData,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.authService.logout(user.id);
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
  }

  // Helpers
  private setTokenCookies(response: Response, tokens: Tokens): void {
    const now = new Date();

    response.cookie('access_token', tokens.access_token, {
      httpOnly: true, // prevents JavaScript access to the cookie
      secure: this.configService.get('NODE_ENV') === 'production', // set to true in production (requires HTTPS)
      sameSite: 'lax', // restricts cookie to same site (CSRF protection)
      expires: new Date(
        now.getTime() +
          parseInt(this.configService.getOrThrow('JWT_ACCESS_TOKEN_TTL')) *
            1000,
      ),
    });

    response.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/auth/refresh',
      expires: new Date(
        now.getTime() +
          parseInt(this.configService.getOrThrow('JWT_REFRESH_TOKEN_TTL')) *
            1000,
      ),
    });
  }
}
