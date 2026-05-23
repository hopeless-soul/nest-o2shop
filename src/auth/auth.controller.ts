import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBody,
} from '@nestjs/swagger';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import type { Request, Response } from 'express';
import type { CurrentUserData, Tokens } from './types';
import { AuthService } from './auth.service';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { CurrentUser } from './decorators/current-user.decorator';
import { ConfigService } from '@nestjs/config';
import { CreateLocalUserDto } from '../users/dto/create-local-user.dto';
import { UsersService } from '../users/users.service';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({
    summary: 'Initiate Google OAuth 2.0 login',
    description: 'Redirects to the Google consent screen. Not usable from Swagger UI — open this URL directly in a browser.',
  })
  @ApiOkResponse({ description: 'Redirects to Google consent page' })
  @Get('google/login')
  @Auth(AuthType.Google)
  googleLogin() {
    return { message: 'Google Authentication' };
  }

  @ApiOperation({
    summary: 'Google OAuth 2.0 callback',
    description: 'Handles redirect from Google. Sets access_token and refresh_token as HttpOnly cookies, then redirects to /.',
  })
  @Get('google/redirect')
  @Auth(AuthType.Google)
  async googleCallback(
    @Req() request: { user: CurrentUserData },
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.issueTokens(request.user);
    this.setTokenCookies(response, tokens);

    // response.cookie('access_token', tokens.access_token, { httpOnly: true });
    // response.cookie('refresh_token', tokens.refresh_token, { httpOnly: true });

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
  @Post('login')
  @Auth(AuthType.Local)
  @HttpCode(HttpStatus.OK)
  async localLogin(
    @CurrentUser() user: CurrentUserData,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.issueTokens(user);
    this.setTokenCookies(response, tokens);
    return tokens;
  }

  @ApiOperation({ summary: 'Register a new account with email and password' })
  @ApiBody({ type: CreateLocalUserDto })
  @ApiCreatedResponse({ type: UserResponseDto, description: 'User created successfully' })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'Validation error or email already in use' })
  @Post('register')
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.CREATED)
  localRegister(@Body() dto: CreateLocalUserDto) {
    return this.usersService.createFromLocal(dto);
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
      httpOnly: true, // prevents JavaScript access to the cookie
      // secure: true, // set to true in production (requires HTTPS)
      // sameSite: true, // restricts cookie to same site (CSRF protection)
      // path: '/refresh', // only sent to the refresh endpoint
      expires: new Date(
        now.getTime() +
          parseInt(this.configService.getOrThrow('JWT_REFRESH_TOKEN_TTL')) *
            1000,
      ),
    });
  }
}
